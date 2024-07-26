import express from "express";
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

const app = express();
app.set("view engine", "ejs");

let http = require("http").Server(app);
let io = require("socket.io")(http);

app.get("/", async (req, res) => {
  res.render("index");
});

async function execute(command) {
  const output = await exec(command);
  return output.stdout.trim();
}

var namespace = "";

io.on("connection", (socket) => {
  socket.on("setNamesapce", async (name, callback) => {
    namespace = name;
    callback({ data: "success" });
  });
  socket.on("checkNamespace", async (msg, callback) => {
    callback({ data: namespace });
  });
  socket.on("list", async (msg, callback) => {
    var data = await execute("kubectl get pods -n " + namespace);
    data = data.split("\n");
    var finalData = [];
    for (var count = 1; count < data.length; count++) {
      finalData.push(data[count].split(/ +/));
    }
    callback({ data: finalData });
  });

  socket.on("delete", async (podname, callback) => {
    var data = await execute(
      "kubectl delete pod " + podname + " -n axcards-dev"
    );
    callback({ data: data });
  });

  socket.on("logs", async (podName, callback) => {
    var serviceName = podName.substring(
      0,
      podName.lastIndexOf("-", podName.lastIndexOf("-") - 1)
    );
    var data = await execute(
      "kubectl logs " + podName + " -c " + serviceName + " -n axcards-dev"
    );
    callback({ data: data });
  });
});

const server = http.listen(7000, function () {
  console.log("Listening: 7000");
});
