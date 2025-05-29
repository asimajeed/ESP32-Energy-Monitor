FROM amazonlinux:2023

# Install required development tools and libraries
RUN dnf groupinstall -y "Development Tools" && \
    dnf install -y gcc openssl-devel bzip2-devel libffi-devel wget tar make && \
    dnf clean all

# Set working directory
WORKDIR /app

# Download and install Python 3.13
RUN wget https://www.python.org/ftp/python/3.13.0/Python-3.13.0.tgz && \
    tar xzf Python-3.13.0.tgz && \
    cd Python-3.13.0 && \
    ./configure --enable-optimizations && \
    make -j$(nproc) && \
    make altinstall && \
    cd .. && \
    rm -rf Python-3.13.0 Python-3.13.0.tgz

# Set default Python and pip
RUN ln -s /usr/local/bin/python3.13 /usr/local/bin/python && \
    ln -s /usr/local/bin/pip3.13 /usr/local/bin/pip

# Set working directory
WORKDIR /app
