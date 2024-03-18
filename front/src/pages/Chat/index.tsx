import { useState, useEffect, useContext } from 'react';
import { StyledContainer } from '../../utils/styles/Atoms.tsx'
import List from '../../components/Chat/List'
import PublicChat from '../../components/Chat/PublicChat/index.tsx';
import Talk from '../../components/Chat/Talk/index.tsx';
import styled from 'styled-components';
import { ChatContext } from '../../utils/context/ChatContext/index.tsx';
import { ProfileContext } from '../../utils/context/ProfileContext/index.tsx';
import Error from '../Error/index.tsx'
import { WebSocketContext } from '../../utils/context/WebSocketContext/index.tsx';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
	display: flex;
	height: 100%;
	width: 100%;
`

function Chat()
{
	const [ tab, setTab ] = useState<string>("join");
	const { logged, status } = useContext(ProfileContext);
	const { talk, logout } = useContext(ChatContext);
	const { token } = useContext(WebSocketContext);
	const navigate = useNavigate();

	useEffect(() => {
		const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();
		document.title = 'Chat - ft_transcendence';
		const contextMenuListener: EventListener = (e) => handleContextMenu(e as unknown as React.MouseEvent);
		document.addEventListener('contextmenu', contextMenuListener);
		return () => document.removeEventListener('contextmenu', contextMenuListener);
	}, []);
	useEffect(() => {
		if (logged && status === "In Game")
			navigate('/game');
		else if (!token || !logged)
			navigate('/');
	}, [logged, status]);
	useEffect(() => {
		if (logout)
			navigate('/');
	}, [logout]);
	return (logged ? <StyledContainer>
				<Container>
					<List tab={tab} setTab={setTab}/>
					{talk === undefined && <PublicChat tab={tab}/>}
					{talk !== undefined && <Talk />}
				</Container>
			</StyledContainer> : <Error />);
}

export default Chat;
