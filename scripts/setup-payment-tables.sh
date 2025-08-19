#!/bin/bash

# Setup payment tables for eSewa integration

echo "Setting up payment tables..."

# Run the SQL script to create payment tables
psql -h localhost -U milan -d antique_auction -f server/database/payment_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Payment tables created successfully!"
else
    echo "❌ Failed to create payment tables"
    exit 1
fi

echo "Payment integration setup complete!"