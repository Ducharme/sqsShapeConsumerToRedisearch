
# Play with docker locally

```
sudo docker build --tag sqsshapeconsumer-toredisearch:v0.01 .
sudo docker run -it sqsshapeconsumer-toredisearch:v0.01
sudo docker logs da29d22cb82d
```

# Setting REDIS_HOST

Can be the IP of the dev computer (172.17.0.1)
Or the kubernetes service (redisearch-service)

# Multiple SQS clients

[Multiple consumers for one queue](https://github.com/bbc/sqs-consumer/issues/51)

# Simulating messages from an IoT device

```
#!/bin/sh

SQS_QUEUE_URL=https://sqs.<REGION>.amazonaws.com/<ACCOUNT_ID>/<QUEUE_NAME>
DEVICE_ID=test-dev-123
TOPIC_NAME=lafleet/devices/location/+/streaming

DT_DEV=$(date +%s%3N)
IOT_MSG="{ \"deviceId\": \"$DEVICE_ID\", \"ts\": $DT_DEV, \"fv\": \"0.0.1\", \"batt\": 99, \"gps\": { \"lat\": 45.505331312, \"lng\": -73.55249779, \"alt\": 10.23 }, \"seq\": 1 }"
aws iot-data publish --topic $TOPIC_NAME --qos 1 --cli-binary-format raw-in-base64-out --payload "$IOT_MSG"


DT_SRV=$(date -d "+1 seconds" +%s%3N)
SQS_MSG="{ \"deviceId\": \"$DEVICE_ID\", \"timestamp\": $DT_DEV, \"server_timestamp\": $DT_SRV, \"firmwareVersion\": \"0.0.1\", \"battery\": 99, \"gps_lat\": 45.505331312, \"gps_lng\": -73.55249779, \"gps_alt\": 10.23, \"topic\": \"$TOPIC_NAME\", \"seq\": 1 }"
aws sqs send-message --queue-url "$SQS_QUEUE_URL" --message-body "$SQS_MSG"

```
