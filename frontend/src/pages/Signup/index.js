import React, { useState, useEffect, useContext } from "react";
import qs from 'query-string'
import ColorModeContext from "../../layout/themeContext";
import bgLogin from "../../assets/bg-login.png";

import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";

import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import usePlans from '../../hooks/usePlans';
import { i18n } from "../../translate/i18n";
import { FormControl } from "@material-ui/core";
import { InputLabel, MenuItem, Select } from "@material-ui/core";

import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";

import Autocomplete from "@material-ui/lab/Autocomplete";

// const Copyright = () => {
// 	return (
// 		<Typography variant="body2" color="textSecondary" align="center">
// 			{"Copyleft "}
// 			<Link color="inherit" href="https://github.com/canove">
// 				Canove
// 			</Link>{" "}
// 			{new Date().getFullYear()}
// 			{"."}
// 		</Typography>
// 	);
// };

const useStyles = makeStyles((theme) => ({
    root: {
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "transparent",
        overflow: "hidden"
    },
    paper: {
        backgroundColor: theme.palette.background.paper,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "450px",
        padding: "30px",
        borderRadius: "12.5px",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
        [theme.breakpoints.down("sm")]: {
            padding: "20px",
            maxWidth: "90%",
        },
    },
    form: {
        width: "100%",
        marginTop: theme.spacing(2),
    },
    submit: {
        margin: theme.spacing(2, 0, 1),
        padding: "10px",
        borderRadius: "0",
        backgroundColor: "#096799",
        fontSize: "12px",
        fontWeight: 500,
        textTransform: "none",
        "&:hover": {
            backgroundColor: "#075781",
        },
    },
    logoContainer: {
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: theme.spacing(6)
    },
    formContainer: {
        flex: 1,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing(3),
        backgroundImage: `url(${bgLogin})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center"
    },
    title: {
        fontSize: "24px",
        fontWeight: 600,
        marginBottom: theme.spacing(0.5),
        color: theme.palette.text.primary
    },
    subtitle: {
        fontSize: "14px",
        color: theme.palette.text.secondary,
        marginBottom: theme.spacing(2),
        textAlign: "center"
    },
    inputField: {
        marginBottom: theme.spacing(1.5),
        "& .MuiOutlinedInput-root": {
            borderRadius: "0",
            backgroundColor: theme.palette.type === 'dark' ? theme.palette.background.default : "#fff",
            "&:hover fieldset": {
                borderColor: "#096799",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#096799",
            }
        },
        "& .MuiInputLabel-root": {
            color: theme.palette.text.secondary
        },
        "& .MuiOutlinedInput-input": {
            color: theme.palette.text.primary,
            padding: "11.5px 14px"
        },
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.23)"
        }
    },
    planSelect: {
        marginTop: theme.spacing(0.5),
        "& .MuiOutlinedInput-root": {
            borderRadius: "0",
            backgroundColor: theme.palette.type === 'dark' ? theme.palette.background.default : "#fff"
        },
        "& .MuiSelect-root": {
            color: theme.palette.text.primary
        }
    },
    planLabel: {
        color: theme.palette.text.secondary,
        marginBottom: theme.spacing(0.5),
        fontSize: "14px"
    },
    loginLink: {
        marginTop: theme.spacing(1),
        textAlign: "center",
        color: "#096799",
        fontSize: "14px",
        "&:hover": {
            textDecoration: "none",
            color: "#075781"
        }
    },
    logoImg: {
        width: "100%",
        maxWidth: "350px",
        height: "auto",
        maxHeight: "120px",
        margin: "0 auto",
        content:
          "url(" +
          (theme.mode === "light"
            ? theme.calculatedLogoLight()
            : theme.calculatedLogoDark()) +
          ")",
    },
}));

const UserSchema = Yup.object().shape({
    name: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("Required"),
    companyName: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("Required"),
    password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
    email: Yup.string().email("Invalid email").required("Required"),
    phone: Yup.string().required("Required"),
});

const SignUp = () => {
    const classes = useStyles();
    const history = useHistory();
    const { getPlanList } = usePlans()
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { colorMode } = useContext(ColorModeContext);
    const { appLogoFavicon, appName, mode } = colorMode;

    let companyId = null
    const params = qs.parse(window.location.search)
    if (params.companyId !== undefined) {
        companyId = params.companyId
    }

    const initialState = { name: "", email: "", password: "", phone: "", companyId, companyName: "", planId: "" };

    const [user] = useState(initialState);

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            const planList = await getPlanList({listPublic: "false"});

            setPlans(planList);
            setLoading(false);
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignUp = async values => {
        try {
            await openApi.post("/auth/signup", values);
            toast.success(i18n.t("signup.toasts.success"));
            history.push("/login");
        } catch (err) {
            toastError(err);
        }
    };

    return (
        <div className={classes.root}>
            <div className={classes.logoContainer}>
                <img className={classes.logoImg} alt="logo" />
            </div>
            <Container component="main" className={classes.formContainer}>
                <div className={classes.paper}>
                    <Typography component="h1" className={classes.title}>
                        {i18n.t("signup.title")}
                    </Typography>
                    <Typography component="h2" className={classes.subtitle}>
                        Preencha os dados abaixo para criar sua conta
                    </Typography>
                    <Formik
                        initialValues={user}
                        enableReinitialize={true}
                        validationSchema={UserSchema}
                        onSubmit={(values, actions) => {
                            setTimeout(() => {
                                handleSignUp(values);
                            }, 400);
                        }}
                    >
                        {({ touched, errors, isSubmitting }) => (
                            <Form className={classes.form}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            variant="outlined"
                                            fullWidth
                                            className={classes.inputField}
                                            id="companyName"
                                            label={i18n.t("signup.form.company")}
                                            error={touched.companyName && Boolean(errors.companyName)}
                                            helperText={touched.companyName && errors.companyName}
                                            name="companyName"
                                            autoComplete="companyName"
                                            autoFocus
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            className={classes.inputField}
                                            autoComplete="name"
                                            name="name"
                                            error={touched.name && Boolean(errors.name)}
                                            helperText={touched.name && errors.name}
                                            variant="outlined"
                                            fullWidth
                                            id="name"
                                            label={i18n.t("signup.form.name")}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Field
                                            as={TextField}
                                            className={classes.inputField}
                                            variant="outlined"
                                            fullWidth
                                            id="email"
                                            label={i18n.t("signup.form.email")}
                                            name="email"                                        
                                            error={touched.email && Boolean(errors.email)}
                                            helperText={touched.email && errors.email}
                                            autoComplete="email"
                                            inputProps={{ style: { textTransform: 'lowercase' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Field
                                            as={TextField}
                                            className={classes.inputField}
                                            variant="outlined"
                                            fullWidth
                                            name="password"
                                            error={touched.password && Boolean(errors.password)}
                                            helperText={touched.password && errors.password}
                                            label={i18n.t("signup.form.password")}
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            autoComplete="current-password"
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
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            className={classes.inputField}
                                            variant="outlined"
                                            fullWidth
                                            id="phone"
                                            label={i18n.t("signup.form.phone")}
                                            name="phone"
                                            autoComplete="phone"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <InputLabel className={classes.planLabel} htmlFor="plan-selection">
                                            Selecione seu plano
                                        </InputLabel>
                                        <Field
                                            as={Select}
                                            variant="outlined"
                                            fullWidth
                                            className={classes.planSelect}
                                            id="plan-selection"
                                            name="planId"
                                            required
                                        >
                                            {plans.map((plan, key) => (
                                                <MenuItem key={key} value={plan.id}>
                                                    {plan.name} - Atendentes: {plan.users} - WhatsApp: {plan.connections} - Filas: {plan.queues} - R$ {plan.amount}
                                                </MenuItem>
                                            ))}
                                        </Field>
                                    </Grid>
                                </Grid>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    className={classes.submit}
                                    disabled={isSubmitting}
                                >
                                    {i18n.t("signup.buttons.submit")}
                                </Button>

                                <Link
                                    href="#"
                                    variant="body2"
                                    component={RouterLink}
                                    to="/login"
                                    className={classes.loginLink}
                                >
                                    {i18n.t("signup.buttons.login")}
                                </Link>
                            </Form>
                        )}
                    </Formik>
                </div>
            </Container>
        </div>
    );
};

export default SignUp;
