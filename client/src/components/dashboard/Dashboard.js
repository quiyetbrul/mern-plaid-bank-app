import React, { useState, useEffect } from "react";
import PlaidLinkButton from "react-plaid-link-button";
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from "../../actions/authActions";
import Accounts from './Accounts';
import { getAccounts, addAccount } from "../../actions/accountActions";
import Spinner from "./Spinner";

const Dashboard = () => {
    const dispatch = useDispatch();

    const { user } = useSelector(state => state.auth);
    const { accounts, accountsLoading } = useSelector(state => state.plaid);

    const [state, setState] = useState({ loaded: false });

    const onLogoutClick = e => {
        e.preventDefault();
        dispatch(logoutUser());
    };

    // Add account
    const handleOnSuccess = (token, metadata) => {
        const plaidData = {
            public_token: token,
            metadata: metadata
        };
        dispatch(addAccount(plaidData));
    };

    useEffect(() => {
        dispatch(getAccounts());
    }, []);

    let dashboardContent;

    if (accounts === null || accountsLoading) {
        dashboardContent = <Spinner />;
    } else if (accounts.length > 0) {
        // User has accounts linked
        dashboardContent = <Accounts user={user} accounts={accounts} />;
    } else {
        // User has no accounts linked
        dashboardContent = (
            <div className="row">
                <div className="col s12 center-align">
                    <h4>
                        <b>Welcome,</b> {user.name.split(" ")[0]}
                    </h4>
                    <p className="flow-text grey-text text-darken-1">
                        To get started, link your first bank account below
                    </p>
                    <div>
                        <PlaidLinkButton
                            buttonProps={{
                                className:
                                    "btn btn-large waves-effect waves-light hoverable blue accent-3 main-btn"
                            }}
                            plaidLinkProps={{
                                clientName: "Quiyet's Bank",
                                key: "bea5e0b34064dedfdea72d151fb8ac",
                                env: "sandbox",
                                product: ["transactions"],
                                onSuccess: handleOnSuccess
                            }}
                            onScriptLoad={() => setState({ loaded: true })}
                        >
                            Link Account
                        </PlaidLinkButton>
                    </div>
                    <button
                        onClick={onLogoutClick}
                        className="btn btn-large waves-effect waves-light hoverable red accent-3 main-btn"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return <div className="container">{dashboardContent}</div>;
}

export default Dashboard;