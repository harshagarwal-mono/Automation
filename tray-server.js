const path = require('path');
const fs = require('fs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { isNil, isEmpty, or, } = require('ramda');

const isNilOrEmpty = or(isNil, isEmpty);

const trayProtoPath = path.join(__dirname, 'Tray.proto');
const packageDefinition = protoLoader.loadSync(trayProtoPath);
const trayProto = grpc.loadPackageDefinition(packageDefinition);

function FireAndForget(relay, call, callback) {
    const { type, data } = call.request;
    const parsedData = isNilOrEmpty(data) ? {} : JSON.parse(data);

    relay.emit(type, parsedData);

    callback(null, {});
}

class GrpcServer {
    constructor(relay, options) {
        this.relay = relay;
        this.endPoint = options.endPoint;

        this.server = new grpc.Server();

        this.server.addService(trayProto.FireAndForget.service, {
            FireAndForget: FireAndForget.bind(null, relay),
        });
    }

    init() {
        if (process.platform === 'darwin') {
            const dirName = path.dirname(this.endPoint);
    
            if (fs.existsSync(this.endPoint)) {
                fs.rmSync(this.endPoint);
            }
    
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true, });
            }
        }
    }

    /**
     * start the server
     * @returns {Promise} - promise which resolved when server started
     */
    startAsync() {
        this.init();

        return new Promise((resolve, reject) => {
            this.server.bindAsync(`unix:${this.endPoint}`, grpc.ServerCredentials.createInsecure(), (err) => {
                if (err) {
                    return reject(err);
                }

                this.server.start();

                return resolve();
            });
        });
    }

    /**
     * destroy the server
     * @returns {undefined} - no return value
     */
    destroy() {
        this.server.forceShutdown();
        this.server = null;
        this.relay = null;
        this.endPoint = null;
    }
}

module.exports = GrpcServer;
