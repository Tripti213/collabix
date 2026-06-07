import { io } from 'socket.io-client';
const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001', {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});
export default socket;
