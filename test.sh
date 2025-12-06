#!/bin/bash
docker build -t cpu .
docker create --name temp-cpu cpu && docker cp temp-cpu:/usr/src/app/out ./out && docker rm temp-cpu

# Exec and debug -> Run extension
