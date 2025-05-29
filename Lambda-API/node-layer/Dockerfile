FROM amazonlinux:2023

# Install Node.js and npm
RUN curl -sL https://rpm.nodesource.com/setup_22.x | bash - \
    && yum install -y nodejs zip \
    && yum clean all

# Set working directory
WORKDIR /app
