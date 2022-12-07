# cheph

`cheph` is a cheap photo management service.
It uses no DB or filesystem.
Instead, `cheph` utilizes S3 and memory.

## Goals

- Use minimum cost to store photos
  - S3 is cheaper than the filesystem (e.g., EBS)
- No DBs, Redis, etc
  - DB is expensive and not resilient
- Resilient
  - S3 is resilient enough (hopefully)
- Stateless
  - Easy to scale out

## No goals

- Fast
  - It fetches S3 objects in *every* request to make it stateless

## License

`cheph` is licensed under the terms of the Apache 2.0 license.
See [LICENSE](./LICENSE) file for details.
