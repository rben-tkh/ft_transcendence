import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import styled from 'styled-components';
import { useContext } from 'react';
import { ProfileContext } from '../../utils/context/ProfileContext';
import { StyledContainer } from '../../utils/styles/Atoms.tsx';
import { SoundContext } from '../../utils/context/SoundContext/index.tsx';
import { WebSocketContext } from '../../utils/context/WebSocketContext/index.tsx';

const Card = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 60%;
	height: 60%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	border: 2px solid dimgrey;
	border-radius: 5px;
`;

const Title = styled.p`
	font-size: 3.3vh;
	margin: 1.2vw;
`;

const SubTitle = styled.p`
	font-size: 2.8vh;
	margin: 1vw;
`;

const Text = styled.p`
	font-size: 2.5vh;
	max-width: 90%;
	margin: 0.8vw;
`;

const InputContainer = styled.div`
	width: 100%;
	height: 15%;
	display: flex;
	justify-content: center;
	align-items: center;
	border-top: 2px solid dimgrey;
	border-bottom-left-radius: 5px;
	border-bottom-right-radius: 5px;
	background: rgb(35, 35, 35, 0.95);
	margin-top: auto;
`

const StyledInput = styled.input<{$isValid: boolean}>`
	width: 100%;
	height: 50%;
	text-align: center;
	font-size: 2vh;
	border: ${(props) => props.$isValid ? "1px solid dimgrey" : "1px solid lightgrey"};
	border-radius: 10px;
	width: 50%;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	&::-webkit-input-placeholder {
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`

export default function TwoFa() {
	const [code, setCode] = useState('');
	const {setLogged, name, status, logged} = useContext(ProfileContext);
	const { handleSFX } = useContext(SoundContext);
	const navigate = useNavigate();
	const { token, headers } = useContext(WebSocketContext);
	const [ placeHolderMsg, setPlaceHolderMsg ] = useState("Enter your 2FA code");
	const [ isValid, setIsValid ] = useState(true);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (/^\d+$/.test(e.target.value) || e.target.value === "")
			setCode(e.target.value);
	}
	const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter')
		{
			if (e.target.value.length < 6) {
				setCode('');
				setPlaceHolderMsg("Code Too Short");
				setIsValid(false);
				handleSFX("goBack")
				return;
			}
			else if (!token) {
				setCode('');
				setPlaceHolderMsg("JWT Token Not Found");
				setIsValid(false);
				handleSFX("goBack")
				return;
			}
			try {
				await axios.post(`${process.env.REACT_APP_URL_LOCAL_BACK}/twofa/activate`, { code }, { headers });
				handleSFX("header")
				setLogged(true);
				navigate('/');
			} catch (err: any) {
				setCode('');
				if (err.response && err.response.status === 400)
					setPlaceHolderMsg("Bad Code");
				else
					setPlaceHolderMsg("An Error Has Occured");
				setIsValid(false);
				handleSFX("goBack")
			}
		}
	};
	useEffect(() => {
		if (logged && status === "In Game")
			navigate('/game');
	}, [logged, status]);
	return (
		<StyledContainer>
			<Card>
				<Title>Hey {name},</Title>
				<SubTitle>Ready for the final level in our security quest ?</SubTitle>
				<Text>It's time to strut your stuff and enter the 2FA secret code stored in your mobile fortress, aka your phone.</Text>
				<Text>Pop in the 2FA code below to complete the sequence and unlock the VIP access to your account :</Text>
				<InputContainer>
					<StyledInput autoFocus $isValid={isValid} type="text" name="twofa" autoComplete="off" placeholder={placeHolderMsg} value={code} maxLength={6} onChange={handleChange} onKeyDown={handleKeyDown}/>
				</InputContainer>
			</Card>
		</StyledContainer>);
}
