# Copy in container .vsix file -> local
docker build -t cpu .
docker create --name temp-cpu cpu
docker cp temp-cpu:/usr/src/app/$(docker run --rm cpu ls | grep .vsix) ./
docker rm temp-cpu
