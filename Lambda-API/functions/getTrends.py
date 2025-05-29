import json
import numpy as np
from datetime import datetime
import pandas as pd
from utils import get_mongo_client

DB_NAME = "power_meter"
DATA_COLLECTION = "readings"
CACHE_COLLECTION = "trends_cache"

DEFAULT_VOLTAGE = 230
DEFAULT_PF = 0.9

def is_peak_time(utc_time, peak_start_min, peak_end_min):
    total_minutes = utc_time.hour * 60 + utc_time.minute
    return peak_start_min <= total_minutes < peak_end_min

def lambda_handler(event, context):
    queryParams = event.get('queryStringParameters') or {}
    required_params = ['start_date', 'end_date', 'base_rate']
    if not all(param in queryParams for param in required_params):
        return {"statusCode": 400, "body": "Missing required parameters"}

    start = queryParams['start_date']
    end = queryParams['end_date']
    base_rate = float(queryParams['base_rate'])
    voltage = float(queryParams.get('voltage', DEFAULT_VOLTAGE))
    pf = float(queryParams.get('power_factor', DEFAULT_PF))
    peak_rate = float(queryParams.get('peak_rate', base_rate))
    peak_start = queryParams.get('peak_start')
    peak_end = queryParams.get('peak_end')
    has_peak = bool(peak_start and peak_end)

    peak_start_min = peak_end_min = 0
    if has_peak:
        try:
            peak_start_min = int(peak_start.split(':')[0]) * 60 + int(peak_start.split(':')[1])
            peak_end_min = int(peak_end.split(':')[0]) * 60 + int(peak_end.split(':')[1])
        except (ValueError, IndexError):
            return {"statusCode": 400, "body": "Invalid peak time format"}

    client = get_mongo_client()
    db = client[DB_NAME]
    collection = db[DATA_COLLECTION]

    try:
        start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
    except ValueError:
        return {"statusCode": 400, "body": "Invalid date format"}

    query = {"Time": {"$gte": start_dt, "$lte": end_dt}}
    cursor = collection.find(query).sort("Time", 1)
    data = list(cursor)
    if not data:
        client.close()
        return {"statusCode": 200, "body": json.dumps({"message": "No data found."})}

    df = pd.DataFrame(data)
    df['Time'] = pd.to_datetime(df['Time'])
    
    df['next_time'] = df['Time'].shift(-1)
    df['deltaT'] = (df['next_time'] - df['Time']).dt.total_seconds().fillna(0)
    df['deltaT'] = np.where(df['deltaT'] > 300, 0, df['deltaT'])  # Ignore gaps >5min
    df.drop(columns=['next_time'], inplace=True)

    for phase in [1, 2, 3]:
        df[f'kWh_phase{phase}'] = (
            voltage * 
            pf * 
            df[f'IRMS{phase}'] * 
            (df['deltaT'] / 3600) / 
            1000
        )

    df['total_kWh'] = df[[f'kWh_phase{i}' for i in [1, 2, 3]]].sum(axis=1)

    if has_peak:
        df['is_peak'] = df['Time'].apply(
            lambda x: is_peak_time(x, peak_start_min, peak_end_min)
        )
        df['rate'] = np.where(df['is_peak'], peak_rate, base_rate)
    else:
        df['is_peak'] = False
        df['rate'] = base_rate

    df['cost'] = df['total_kWh'] * df['rate']

    total_energy = df['total_kWh'].sum()
    total_cost = df['cost'].sum()
    
    peak_energy = df.loc[df['is_peak'], 'total_kWh'].sum()
    off_peak_energy = total_energy - peak_energy
    
    peak_cost = df.loc[df['is_peak'], 'cost'].sum()
    off_peak_cost = total_cost - peak_cost

    df['hour'] = df['Time'].dt.hour
    df['date'] = df['Time'].dt.date
    df['weekday'] = df['Time'].dt.day_name()
    df['hour_slot'] = df['Time'].dt.floor('H')

    hourly_avg_kWh = df.groupby('hour')['total_kWh'].mean().round(4)
    daily_kWh = df.groupby('date')['total_kWh'].sum().round(4)
    daily_cost = df.groupby('date')['cost'].sum().round(2)
    daily_totals_df = daily_kWh.reset_index(name='daily_kWh')
    
    daily_totals_df['date'] = pd.to_datetime(daily_totals_df['date'])
    daily_totals_df['weekday'] = daily_totals_df['date'].dt.day_name()
    weekday_avg_daily_kWh = daily_totals_df.groupby('weekday')['daily_kWh'].mean().round(4)
    
    top_hours = df.groupby('hour_slot')['total_kWh'].sum().nlargest(3)

    result = {
        "total_energy_kWh": round(total_energy, 4),
        "total_cost_PKR": round(total_cost, 2),
        "on_peak_energy_kWh": round(peak_energy, 4),
        "off_peak_energy_kWh": round(off_peak_energy, 4),
        "on_peak_cost_PKR": round(peak_cost, 2),
        "off_peak_cost_PKR": round(off_peak_cost, 2),
        "hourly_avg_kWh": {
            "labels": hourly_avg_kWh.index.astype(str).tolist(),
            "data": hourly_avg_kWh.values.tolist()
        },
        "daily_kWh": {
            "labels": [d.strftime('%Y-%m-%d') for d in daily_kWh.index],
            "data": daily_kWh.values.tolist()
        },
        "daily_cost_PKR": {
            "labels": [d.strftime('%Y-%m-%d') for d in daily_cost.index],
            "data": daily_cost.values.tolist()
        },
        "weekday_avg_kWh": {
            "labels": weekday_avg_daily_kWh.index.tolist(),
            "data": weekday_avg_daily_kWh.values.tolist()
        },
        "peak_usage_hours": {
            "labels": [ts.strftime('%Y-%m-%d %H:%M:%S') for ts in top_hours.index],
            "data": top_hours.round(4).values.tolist()
        }
    }

    client.close()
    return {"statusCode": 200, "body": json.dumps(result)}

'''print(lambda_handler({
    "end_date": "2025-04-10T00:00:00Z",
    "start_date": "2025-03-10T00:00:00Z",
    "base_rate": 35,
    "peak_rate": 40,
    "peak_start": "18:30",
    "peak_end": "22:30"
}, ''))'''