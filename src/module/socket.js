// Foward declarations
/**
 * Data object used in processing system socket messages.
 * 
 * @typedef {object} MWIIMessageData
 * @property {string}  recipient Who the message is being sent to
 * @property {string}  sender    Who is sending the message
 * @property {string}  eventName The name of the event that is being processed
 * @property {unknown} payload   The data that is being processed
 */

/**
 * Function called when an event fires.
 * 
 * @typedef {object} MWIICallback
 * @property {string} target The user the message is being sent to
 * @property {(message: MWIIMessageData) => void} callback The function that is called
 */

/**
 * A collection of callback functions stored by event name.
 * 
 * @typedef {{[key: string]: MWIICallback[]}} MWIICallbacks
 */

/**
 * Custom handler for system socket messages. 
 * 
 * Borrows from the `RPC` class from the Starfinder system.
 */
export default class MWIISocket {
    constructor() {
        /**
         * A collection of callback functions stored by event name.
         * @type {MWIICallbacks}
         */
        this.callbacks = {};

        /**
         * A buffer for collecting messages before the socket is initialized
         * @type {MWIIMessageData[]}
         */
        this.messageBuffer = [];

        /**
         * A flag to determine if the socket has been initialized or not
         * @type {boolean}
         */
        this.initialized = false;
    }

    /**
     * Method that handles incoming socket messages for the system.
     * 
     * @param {MWIIMessageData} message The message data to process.
     */
    async handleMessage(message) {
        const { recipient, eventName } = message;
        if (recipient) {
            if (recipient === 'gm') {
                if (!game.user.isGM) {
                    return false;
                }
            } else if (recipient !== game.user.id) {
                return false;
            }
        }

        let wasHandled = false;
        const handlers = this.callbacks[eventName];
        if (handlers) {
            const filteredCallbacks = [];
            for (const callback of handlers) {
                if ((callback.target === 'gm' && game.user.isGM)
                    || (callback.target === 'player' && !game.user.isGM)
                    || (callback.target === 'local' && recipient === game.user.id)
                    || callback.target === 'any') {
                        filteredCallbacks.push(callback.callback(message));
                }
            }

            if (filteredCallbacks.length > 0) {
                await Promise.all(filteredCallbacks);
                wasHandled = true;
            }
        }

        if (!wasHandled) {
            console.log(`> Failed to handle Socket call for '${eventName}'`);
        }
    }

    /**
     * Initialize the socket for sending messages.
     */
    initialize() {
        if (!this.initialized) {
            game.socket.on('system.mwii', (data) => this.handleMessage(data));
            this.initialized = true;

            if (this.messageBuffer.length > 0) {
                for (const messageData of this.messageBuffer) {
                    game.socket.emit('system.mwii', messageData);
                }

                this.messageBuffer = null;
            }

            console.log('Mechwarrior 2nd Edition | Initialized sockets');
        }        
    }

    /**
     * Send a message via socket to be processed by other foundry clients.
     * 
     * @param {string} eventName Then event that this message is for
     * @param  {...any} args Data that needs to be processed with this message
     */
    sendMessage(eventName, ...args) {
        /** @type {MWIIMessageData} */
        const messageData = {
            recipient: null,
            sender: game.user.id,
            eventName: eventName,
            payload: args
        };

        if (this.initialized) {
            game.socket.emit('system.mwii', messageData);
        } else {
            this.messageBuffer.push(messageData);
        }
    }

    /**
     * Send a message to a specific recipient where the message will be processed.
     * 
     * @param {string} recipient The user that needs to respond to this message
     * @param {string} eventName The event that the user is responding to
     * @param {unkown} payload The data that needs to be processed
     * @returns {string} 
     */
    sendMessageTo(recipient, eventName, payload) {
        const messageData = {
            recipient,
            sender: game.user.id,
            eventName,
            payload
        };

        if (recipient === 'gm' && game.user.isGM) {
            this.handleMessage(messageData);
            return 'successMessageHandled';
        }

        if (recipient === game.user.id) {
            this.handleMessage(messageData);
            return 'successMessageHandled';
        }

        if (this.initialized) {
            let isRecipientActive = false;
            if (recipient === 'gm') {
                for (const user of game.users.contents) {
                    if (user.isGM && user.active) {
                        isRecipientActive = true;
                        break;
                    }
                }
            } else {
                const recipientUser = game.users.get(recipient);
                isRecipientActive = recipientUser?.active || false;
            }

            if (isRecipientActive) {
                game.socket.emit('system.mwii', messageData);
                return 'successMessageSent';
            } else {
                return 'errorRecipientNotAvailable';
            }
        } else {
            this.messageBuffer.push(messageData);
            return 'sucessMessagePending';
        }
    }

    /**
     * Register a function that will be called when an event is triggered.
     * 
     * @param {string} eventName The event being registered for
     * @param {string} target Who this event is being sent to
     * @param {Function} callback The function that will be called when this event is triggered
     */
    registerCallback(eventName, target, callback) {
        const acceptedTargets = ["gm", "player", "local", "any"];
        if (!acceptedTargets.includes(target)) {
            throw new Error(`Invalid target specified (${target}) registering event '${eventName}'! Value must be ${acceptedTargets.join(',')}.`);
        }

        const callbackItem = {
            callback,
            target
        };

        if (eventName in this.callbacks) {
            this.callbacks[eventName] = this.callbacks[eventName].push(callbackItem);
        } else {
            this.callbacks[eventName] = [callbackItem];
        }
    }

    /**
     * Unregister a callback function for an event.
     * 
     * @param {string} eventName The event that this callback is being removed from
     * @param {Function} callback The function that is being removed
     */
    unregisterCallback(eventName, callback) {
        if (eventName in this.callbacks) {
            this.callbacks[eventName] = this.callbacks[eventName].filter(x => x.callback !== callback);
            if (this.callbacks.length === 0) {
                delete this.callbacks[eventName];
            }
        }
    }
}