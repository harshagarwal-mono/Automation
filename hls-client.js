const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'Hls.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const elevationProto = grpc.loadPackageDefinition(packageDefinition);

class HlsClient {
    constructor(opts) {       
        this.clientFireAndForget = new elevationProto.FireAndForget(
            `unix:${opts.endPoint}`,
            grpc.credentials.createInsecure()
        );
    }

    /**
     * fire and forget request to hls
     * @private - private member
     * @param {String} type - event to be emitted
     * @param {Object} data - data to be sent
     * @returns {Promise} - which resolves with value true when request is sent to hls and reject if not sent
     */
    fireAndForgetRequest(type, data = {}) {
        return new Promise((resolve, reject) => {
            const message = {
                type,
                data: JSON.stringify(data),
            };

            this.clientFireAndForget.FireAndForget(message, (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(true);
            });
        });
    }

    /**
     * clean up
     * @returns {undefined} - no return value
     */
    destroy() {
        this.endPoint = null;
    }
}

module.exports = HlsClient;
