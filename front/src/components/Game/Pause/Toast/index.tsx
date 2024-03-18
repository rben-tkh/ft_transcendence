import styled from "styled-components";

const Card = styled.div`
	position: fixed;
	top: 9%;
	left: 85%;
	transform: translate(-50%, -50%);
	width: 24%;
	height: 5%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	border: 1px solid dimgrey;
	border-radius: 5px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50), rgb(25, 25, 25));
	z-index: 12;
`;

const Text = styled.p`
	font-size: 1vw;
`

function Toast()
{
	return (<Card>
				<Text>The match will be paused after the next round.</Text>
			</Card>);
}

export default Toast;
