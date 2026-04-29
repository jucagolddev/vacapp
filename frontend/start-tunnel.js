const { spawn } = require('child_process');
const fs = require('fs');

console.log("Iniciando http-server en puerto 8080...");
const server = spawn('npx.cmd', ['http-server', 'dist/vacapp/browser', '-p', '8080', '--cors'], { shell: true });

server.stdout.on('data', data => {
  if (data.toString().includes('Hit CTRL-C to stop the server')) {
     console.log("Server started.");
     console.log("Iniciando localtunnel...");
     const lt = spawn('npx.cmd', ['localtunnel', '--port', '8080'], { shell: true });

     lt.stdout.on('data', (ltData) => {
         const output = ltData.toString();
         console.log(output);
         if(output.includes("your url is:")) {
             const url = output.split("your url is: ")[1].trim();
             fs.writeFileSync('tunnel_url.txt', url);
             console.log("URL GUARDADA:", url);
         }
     });
     
     lt.stderr.on('data', err => console.error("LT_ERR:", err.toString()));
  }
});
