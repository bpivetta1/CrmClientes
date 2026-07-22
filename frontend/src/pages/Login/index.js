import React, { useState, useContext, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import useSettings from "../../hooks/useSettings";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import { Helmet } from "react-helmet";
import bgLogin from "../../assets/bg-login.png";

const useStyles = makeStyles((theme) => ({
	root: {
		width: "100vw",
		height: "100vh",
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		background: theme.mode === "light" ? theme.palette.light : theme.palette.dark,
		[theme.breakpoints.down("sm")]: {
			flexDirection: "column",
			height: "auto",
			minHeight: "100vh",
		},
	},
	leftSide: {
		width: "50%",
		height: "100vh",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.mode === "light" ? "#ebf2ff" : "#11111e",
		padding: "20px",
		[theme.breakpoints.down("sm")]: {
			width: "100%",
			height: "auto",
			padding: "10px 0",
		},
	},
	containerFooter: {
		display: "flex",
		flexDirection: "column",
		justifyContent: "flex-end",
		alignItems: "center",
		textAlign: "center",
		fontSize: "0.875rem",
		color: theme.mode === "light" ? "#333" : "#ccc",
		width: "100%",
		padding: "15px",
		lineHeight: "1.4",
		marginTop: "auto",
		"& p": {
			margin: "5px 0",
		},
		"& a": {
			color: theme.mode === "light" ? "#333" : "#ccc",
			textDecoration: "none",
			fontWeight: "bold",
		},
		"& a:hover": {
			textDecoration: "underline",
		},
	},
	rightSide: {
		width: "50%",
		height: "100%",
		backgroundImage: `url(${bgLogin})`,
		backgroundSize: "cover",
		backgroundRepeat: "no-repeat",
		backgroundPosition: "center",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		[theme.breakpoints.down("sm")]: {
			width: "100%",
			height: "auto",
			minHeight: "60vh",
			backgroundImage: "none",
			backgroundColor: theme.mode === "light" ? "#fff" : "#222",
		},
	},
	logoImg: {
		width: "80%",
		maxWidth: "300px",
		height: "auto",
		margin: "0 auto",
		[theme.breakpoints.down("sm")]: {
			maxWidth: "180px",
			margin: "20px auto",
		},
	},
	paper: {
		backgroundColor: theme.mode === "light" ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.2)",
		backdropFilter: "blur(10px)",
		boxShadow: theme.mode === "light" ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "0 4px 6px rgba(255, 255, 255, 0.2)",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		padding: "40px 10px",
		borderRadius: "25px",
		width: "100%",
		[theme.breakpoints.down("sm")]: {
			padding: "20px 5px",
			borderRadius: "12px",
			minWidth: "0",
			boxShadow: "none",
		},
	},
	form: {
		width: "100%",
		marginTop: theme.spacing(1),
	},
	submit: {
		margin: theme.spacing(3, 0, 2),
		borderRadius: "12px",
		backgroundColor: "#245798",
		color: "#fff",
		"&:hover": {
			backgroundColor: "#1d4e85",
		},
	},
	register: {
		borderRadius: "12px",
		borderColor: "#245798",
		color: "#245798",
		"&:hover": {
			borderColor: "#1d4e85",
			backgroundColor: "rgba(29, 78, 133, 0.04)",
		},
	},
	iconButton: {
		position: "absolute",
		top: 10,
		right: 10,
		color: theme.mode === "light" ? "black" : "white",
	},
	selectFocus: {
		"& .MuiOutlinedInput-root": {
			backgroundColor: "transparent",
		},
		"& .MuiOutlinedInput-root:hover": {
			backgroundColor: "transparent",
		},
		"& .MuiOutlinedInput-root.Mui-focused": {
			backgroundColor: "transparent",
		},
		"& .MuiSelect-root": {
			backgroundColor: "transparent",
		},
		"& .MuiSelect-root.Mui-focused": {
			backgroundColor: "transparent",
		},
		"& .MuiOutlinedInput-notchedOutline": {
			borderColor: "1px solid #bebebe",
			borderRadius: "12px",
		},
		"&:hover .MuiOutlinedInput-notchedOutline": {
			borderColor: "#8a8a8a",
			borderRadius: "12px",
		},
		"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
			border: "1px solid #bebebe",
			borderRadius: "12px",
		},
	},
	labelFocus: {
		"& .MuiInputLabel-outlined": {
			color: theme.mode === "dark" ? "#fff" : "#8c8a8a",
		},
		"& .MuiInputLabel-outlined.Mui-focused": {
			color: theme.mode === "dark" ? "#fff" : "#8c8a8a",
		},
	},
	textFieldCustom: {
		"& .MuiOutlinedInput-root": {
			backgroundColor: theme.mode === "light" ? "#e0e0e0" : "#245798",
			borderRadius: "12px",
			color: theme.mode === "light" ? "#000" : "#fff",
		},
		"& .MuiOutlinedInput-root:hover": {
			backgroundColor: theme.mode === "light" ? "#d6d6d6" : "#1d4e85",
		},
		"& .MuiOutlinedInput-root.Mui-focused": {
			backgroundColor: theme.mode === "light" ? "#d6d6d6" : "#1d4e85",
		},
		"& .MuiOutlinedInput-notchedOutline": {
			borderColor: theme.mode === "light" ? "#bebebe" : "#fff",
			borderRadius: "12px",
		},
		"&:hover .MuiOutlinedInput-notchedOutline": {
			borderColor: theme.mode === "light" ? "#8a8a8a" : "#d6d6d6",
		},
		"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
			borderColor: theme.mode === "light" ? "#bebebe" : "#fff",
		},
	},
	logoWrapper: {
		flex: 1,
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
}));

const Login = () => {
	const classes = useStyles();
	const { colorMode } = useContext(ColorModeContext);
	const { appLogoFavicon, appName, mode } = colorMode;
	const [user, setUser] = useState({ email: "", password: "" });
	const { getPublicSetting } = useSettings();
	const { handleLogin } = useContext(AuthContext);
	const [showPassword, setShowPassword] = useState(false);
	const theme = useTheme();

	const handleChangeInput = (e) => {
		setUser({ ...user, [e.target.name]: e.target.value });
	};

	const handlSubmit = (e) => {
		e.preventDefault();
		handleLogin(user);
	};

	const handleClickShowPassword = () => {
		setShowPassword(!showPassword);
	};

	const handleMouseDownPassword = (event) => {
		event.preventDefault();
	};

	return (
		<>
			<Helmet>
				<title>{appName || "WORKZAP"}</title>
				<link rel="icon" href={appLogoFavicon || "/default-favicon.ico"} />
			</Helmet>
			<div className={classes.root}>
				<div className={classes.leftSide}>
					<div className={classes.logoWrapper}>
						<img
							className={classes.logoImg}
							alt={"Logo"}
							src={theme.mode === "light" ? theme.calculatedLogoLight() : theme.calculatedLogoDark()}
						/>
					</div>
					<div className={classes.containerFooter}>
						<p>
							Copyright ©{" "}
							<a href={"https://seulink.com.br"} target={"_blank"} rel="noopener noreferrer">
								Sua empresa{""}
							</a>{" "}
							2024{" "}
						</p>
						<p>
							This site is protected by reCAPTCHA Enterprise and the Google{" "}
							<a href={"https://seulink.com.br/politica-de-privacidade"} target={"_blank"} rel="noopener noreferrer">
								Privacy Policy
							</a>{" "}
							and{" "}
							<a href={"https://seulink.com.br/politica-de-privacidade"} target={"_blank"} rel="noopener noreferrer">
								Terms of Service
							</a>
						</p>
					</div>
				</div>
				
				<div className={classes.rightSide}>
					<Container component="main" maxWidth="xs">
						<CssBaseline />
						<div className={classes.paper}>
							<IconButton className={classes.iconButton} onClick={colorMode.toggleColorMode}>
								{mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
							</IconButton>
							<form className={classes.form} noValidate onSubmit={handlSubmit}>
								<TextField
									variant="outlined"
									margin="normal"
									required
									fullWidth
									id="email"
									label={i18n.t("login.form.email")}
									name="email"
									value={user.email}
									onChange={handleChangeInput}
									autoComplete="email"
									autoFocus
									className={`${classes.textFieldCustom} ${classes.selectFocus} ${classes.labelFocus}`}
								/>
								<TextField
									variant="outlined"
									margin="normal"
									required
									fullWidth
									name="password"
									label={i18n.t("login.form.password")}
									type={showPassword ? "text" : "password"}
									id="password"
									value={user.password}
									onChange={handleChangeInput}
									autoComplete="current-password"
									className={`${classes.textFieldCustom} ${classes.selectFocus} ${classes.labelFocus}`}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													aria-label="toggle password visibility"
													onClick={handleClickShowPassword}
													onMouseDown={handleMouseDownPassword}
													edge="end"
												>
													{showPassword ? <Visibility /> : <VisibilityOff />}
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
								<Button
									type="submit"
									fullWidth
									variant="contained"
									className={classes.submit}
								>
									{i18n.t("login.buttons.submit")}
								</Button>
								<Button
									fullWidth
									variant="outlined"
									className={classes.register}
									component={RouterLink}
									to="/signup"
									style={{
										marginTop: '10px',
										borderRadius: '12px',
										borderColor: '#245798',
										color: '#245798',
										'&:hover': {
											borderColor: '#1d4e85',
											backgroundColor: 'rgba(29, 78, 133, 0.04)'
										}
									}}
								>
									{i18n.t("login.buttons.register")}
								</Button>
							</form>
						</div>
					</Container>
				</div>
			</div>
		</>
	);
};


export default Login;
