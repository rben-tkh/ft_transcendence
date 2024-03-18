import styled from "styled-components";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { SoundContext } from "../../../../utils/context/SoundContext";
import { ProfileContext } from "../../../../utils/context/ProfileContext";
import Warning from '../../../../assets/images/chat/warning.svg';
import Loader from "../../../../utils/styles/Loader";
import { WebSocketContext } from "../../../../utils/context/WebSocketContext";

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.6);
	z-index: 10;
`;

const Card = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 55%;
	height: 65%;
	display: flex;
	flex-direction: column;
	justify-content: space-evenly;
	align-items: center;
	text-align: center;
	background: linear-gradient(0.5turn, rgb(50, 50, 50), rgb(25, 25, 25));
	border: 2px solid dimgrey;
	border-radius: 5px;
`;

const Text = styled.p<{$isFirst: boolean}>`
	font-size: ${(props) => props.$isFirst ? "2.6vh" : "2.5vh"};
	max-width: 90%;
	margin-top: ${(props) => props.$isFirst ? "0.5vh" : "-0.5vh"};
	margin-bottom: ${(props) => props.$isFirst ? "-0.5vh" : "0.5vh"};
`;

const StyledInput = styled.input<{$isValid: boolean}>`
	width: 40%;
	height: 8%;
	text-align: center;
	font-size: 2vh;
	border: ${(props) => props.$isValid ? "1px solid dimgrey" : "1px solid lightgrey"};
	border-radius: 10px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	&::-webkit-input-placeholder {
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`

const PrevLink = styled.button`
	height: auto;
	width: auto;
	font-size: 2vh;
	border: 1px solid dimgrey;
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`;

function Twofa(props: {setDisplayTwoFA: (value: boolean) => void}) {
	const { tfa, setTfa } = useContext(ProfileContext);
	const { token, headers } = useContext(WebSocketContext);
	const [ qrCodeURL, setQrCodeURL ] = useState("");
	const [ code, setCode ] = useState('');
	const { handleSFX } = useContext(SoundContext);
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
				setTfa(tfa === "checking" ? "enable" : "canceled");
				handleSFX(tfa === "checking" ? "clic" : "goBack")
				props.setDisplayTwoFA(false);
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
	const handleGoBack = () => {
		props.setDisplayTwoFA(false);
		if (tfa === "checking")
			setTfa("canceled")
		handleSFX("goBack")
	}
	useEffect(() => {
		if (token && tfa === "checking") {
			axios.get(`${process.env.REACT_APP_URL_LOCAL_BACK}/twofa/generate`, { headers })
			.then(response => {
				setQrCodeURL(response.data.code)
			})
			.catch(err => {
				console.error(err);
				// Ajouter une gestion d'erreur spécifique, par exemple rediriger vers la page de connexion
			});
		} else if (!token) {
			console.error("JWT Token Not Found");
			// Redirection ou gestion de l'erreur
		}
	}, [token]);
	return (<Overlay>
				<Card style={tfa === "checking" ? {width: "60%", height: "70%"} : {}}>
					{tfa === "checking" ? qrCodeURL ? <><img style={{height: "35%"}} src={qrCodeURL} alt="QRCode" />
					<Text $isFirst={true}>Your phone is your ally, so suit it up for this new mission :</Text>
					<Text $isFirst={false}>Scan, enter the code, and let us handle the rest.<br />Because today, even Pong-enthusiasts need VIP security!</Text></> : <Loader/> : <>
					<img style={{height: "8vh"}} src={Warning} alt="Warning.svg" />
					<Text style={{fontSize: "3vh", fontWeight: "500", marginBottom: "-1vh"}}>Are you sure you want to disable 2FA?</Text>
					<Text $isFirst={true}>Enter the code stored in your faithful companion to deactivate VIP security.</Text>
					<Text $isFirst={false}>After all, even Pong enthusiasts sometimes need to play in casual mode!</Text></>}
					{(tfa !== "checking" || qrCodeURL) && <><StyledInput autoFocus $isValid={isValid} type="text" name="twofa" autoComplete="off" placeholder={placeHolderMsg} value={code} maxLength={6} onChange={handleChange} onKeyDown={handleKeyDown}/>
					<PrevLink onClick={handleGoBack}>Go Back</PrevLink></>}
				</Card>
			</Overlay>);
}

export default Twofa;
