const HlsClient = require('./hls-client');
const TrayServer = require('./tray-server');
const { EventEmitter } = require('events');
const fs = require('fs');

const readJsonFile = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');

  return JSON.parse(fileContent);
};

const writeJsonFile = (filePath, data) => {
  const fileContent = JSON.stringify(data);

  fs.writeFileSync(filePath, `${fileContent}\n`);
};

const PrintEventsToJsonFile = (filePath, {
  type, 
  data,
}) => {
  const event = {
    type,
    data,
    timestamp: new Date(Date.now()).toLocaleString(),
  };

  writeJsonFile(filePath, event);

  process.exit(0);
}

const addEventListeners = (relay, filePath) => {
   const eventsToRegistered = [
      'LoginStatusResponse',
   ];
   
   eventsToRegistered.forEach((event) => {
       relay.on(event, (data) => {
           PrintEventsToJsonFile(filePath, {
               type: event,
               data,
           });
       });
   });
};

const main = async (opts) => {
  const relay = new EventEmitter();

  const trayServer = new TrayServer(relay, {
      endPoint: opts.TrayEndPoint,
  });
  const hlsClient = new HlsClient({
      endPoint: opts.HlsEndPoint,
  });

  addEventListeners(relay, opts.OutputFilePath);

  await trayServer.startAsync();

  await hlsClient.fireAndForgetRequest(opts.RequestType, opts.RequestData);
};

const inputFilePath = process.argv[2];
const inputs = readJsonFile(inputFilePath);
console.log("Inputs Provided", inputs);

main(inputs);
