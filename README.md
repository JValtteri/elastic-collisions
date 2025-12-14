# Elastic Collisions

### Simplified particle simulation model/game

Allows user to experiment with simulates elastic collisions between particles, such as gas atoms

![](screenshot.png)

### Use online

See automatically deployed page **[here](https://jvaltteri.github.io/elastic-collisions/)**

### Use offline

1. pull repository
2. start a local server (bring your own server)
3. double click index.html

#### Server options

##### Go-server
A light server suitable for homelab: https://github.com/JValtteri/go-server

##### Python server
Not tested with this project, but may work

Run this command in the project root

```
screen -S front -d -m python -m http.server 8000
```

##### Pro server
- nginx
- caddy

