
# Play with docker locally

```
sudo docker build --tag sqsshapeconsumer-toredisearch:v0.01 .
sudo docker run -it sqsshapeconsumer-toredisearch:v0.01
sudo docker logs da29d22cb82d
```

# Setting REDIS_HOST

Can be the IP of the dev computer (172.17.0.1)
Or the kubernetes service (redisearch-service)

