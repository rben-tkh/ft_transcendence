import { createContext, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

type WebSocketContextType = {
	token?: string;
	headers?: string;
	socket?: Socket;
};

export const WebSocketContext = createContext<WebSocketContextType>({
	token: undefined,
	headers: undefined,
	socket: undefined,
});

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
	const token = Cookies.get('accessToken');
	const headers = { 'Authorization': `Bearer ${token}` };
	const socket = io(process.env.REACT_APP_URL_LOCAL_BACK, { transports: ["websocket"] });

	return (
		<WebSocketContext.Provider value={{ token, headers, socket }}>
			{children}
		</WebSocketContext.Provider>);
};
