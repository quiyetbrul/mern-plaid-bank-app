import React, { useState, useEffect } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import classnames from "classnames";
import { registerUser } from '../../actions/authActions';

const Register = (props) => {

    const initialState = {
        name: "",
        email: "",
        password: "",
        password2: "",
        errors: {}
    };

    const [state, setState] = useState(initialState);

    const dispatch = useDispatch();

    const auth = useSelector(state => state.auth);
    const errors = useSelector(state => state.errors);

    useEffect(() => {
        // If logged in and user navigates to Register page, should redirect them to dashboard
        if (auth.isAuthenticated) {
            props.history.push("/dashboard");
        }
    },[auth.isAuthenticated, props.history])

    const onChange = e => {
        setState({ ...state, [e.target.id]: e.target.value });
    };

    const onSubmit = e => {
        e.preventDefault();
        const newUser = {
            name: state.name,
            email: state.email,
            password: state.password,
            password2: state.password2
        };
        dispatch(registerUser(newUser, props.history));
    };

    return (
        <div className="container">
            <div className="row">
                <div className="col s8 offset-s2">
                    <Link to="/" className="btn-flat waves-effect">
                        <i className="material-icons left">keyboard_backspace</i> Back to
                        home
                    </Link>
                    <div className="col s12" style={{ paddingLeft: "11.250px" }}>
                        <h4>
                            <b>Register</b> below
                        </h4>
                        <p className="grey-text text-darken-1">
                            Already have an account? <Link to="/login">Log in</Link>
                        </p>
                    </div>
                    <form noValidate onSubmit={onSubmit}>
                        <div className="input-field col s12">
                            <input
                                onChange={onChange}
                                value={state.name}
                                error={errors.name}
                                id="name"
                                type="text"
                                className={classnames("", {
                                    invalid: errors.name
                                })}
                            />
                            <label htmlFor="name">Name</label>
                            <span className="red-text">{errors.name}</span>
                        </div>
                        <div className="input-field col s12">
                            <input
                                onChange={onChange}
                                value={state.email}
                                error={errors.email}
                                id="email"
                                type="email"
                                className={classnames("", {
                                    invalid: errors.email
                                })}
                            />
                            <label htmlFor="email">Email</label>
                            <span className="red-text">{errors.email}</span>
                        </div>
                        <div className="input-field col s12">
                            <input
                                onChange={onChange}
                                value={state.password}
                                error={errors.password}
                                id="password"
                                type="password"
                                className={classnames("", {
                                    invalid: errors.password
                                })}
                            />
                            <label htmlFor="password">Password</label>
                            <span className="red-text">{errors.password}</span>
                        </div>
                        <div className="input-field col s12">
                            <input
                                onChange={onChange}
                                value={state.password2}
                                error={errors.password2}
                                id="password2"
                                type="password"
                                className={classnames("", {
                                    invalid: errors.password2
                                })}
                            />
                            <label htmlFor="password2">Confirm Password</label>
                            <span className="red-text">{errors.password2}</span>
                        </div>
                        <div className="col s12" style={{ paddingLeft: "11.250px" }}>
                            <button
                                style={{
                                    width: "150px",
                                    borderRadius: "3px",
                                    letterSpacing: "1.5px",
                                    marginTop: "1rem"
                                }}
                                type="submit"
                                className="btn btn-large waves-effect waves-light hoverable blue accent-3"
                            >
                                Sign up
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


export default withRouter(Register);