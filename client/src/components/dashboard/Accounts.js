import React, { useEffect, useState } from "react";
import PlaidLinkButton from "react-plaid-link-button";
import { useSelector, useDispatch } from "react-redux";
import {
    getTransactions,
    addAccount,
    deleteAccount
} from "../../actions/accountActions";
import { logoutUser } from "../../actions/authActions";
import MaterialTable from "material-table";

const Accounts = (props) => {

    const dispatch = useDispatch();

    const [state, setState] = useState({ loaded: false });

    useEffect(() => {
        dispatch(getTransactions(props.accounts));
    }, [props.accounts]);

    // Add account
    const handleOnSuccess = (token, metadata) => {
        const { accounts } = props;
        const plaidData = {
            public_token: token,
            metadata: metadata,
            accounts: accounts
        };
        dispatch(addAccount(plaidData));
    };

    // Delete account
    const onDeleteClick = id => {
        const { accounts } = props;
        const accountData = {
            id: id,
            accounts: accounts
        };
        dispatch(deleteAccount(accountData));
    };

    // Logout
    const onLogoutClick = e => {
        e.preventDefault();
        dispatch(logoutUser());
    };

    const { user, accounts } = props;
    const { transactions, transactionsLoading } = useSelector(state => state.plaid);

    let accountItems = accounts.map(account => (
        <li key={account._id} style={{ marginTop: "1rem" }}>
            <button
                style={{ marginRight: "1rem" }}
                onClick={() => onDeleteClick(account._id)}
                className="btn btn-small btn-floating waves-effect waves-light hoverable red accent-3"
            >
                <i className="material-icons">delete</i>
            </button>
            <b>{account.institutionName}</b>
        </li>
    ));
    // Setting up data table
    const transactionsColumns = [
        { title: "Account", field: "account" },
        { title: "Date", field: "date", type: "date", defaultSort: "desc" },
        { title: "Name", field: "name" },
        { title: "Amount", field: "amount" },
        { title: "Category", field: "category" }
    ];
    let transactionsData = [];
    transactions.forEach(function (account) {
        account.transactions.forEach(function (transaction) {
            transactionsData.push({
                account: account.accountName,
                date: transaction.date,
                category: transaction.category[0],
                name: transaction.name,
                amount: transaction.amount
            });
        });
    });
    return (
        <div className="row">
            <div className="col s12">
                <button
                    onClick={onLogoutClick}
                    className="btn-flat waves-effect"
                >
                    <i className="material-icons left">keyboard_backspace</i> Log Out
                    </button>
                <h4>
                    <b>Welcome!</b>
                </h4>
                <p className="grey-text text-darken-1">
                    Hey there, {user.name.split(" ")[0]}
                </p>
                <h5>
                    <b>Linked Accounts</b>
                </h5>
                <p className="grey-text text-darken-1">
                    Add or remove your bank accounts below
          </p>
                <ul>{accountItems}</ul>
                <PlaidLinkButton
                    buttonProps={{
                        className:
                            "btn btn-large waves-effect waves-light hoverable blue accent-3 main-btn"
                    }}
                    plaidLinkProps={{
                        clientName: "Paul's Bank",
                        key: "bea5e0b34064dedfdea72d151fb8ac",
                        env: "sandbox",
                        product: ["transactions"],
                        onSuccess: handleOnSuccess
                    }}
                    onScriptLoad={() => setState({ loaded: true })}
                >
                    Add Account
                    </PlaidLinkButton>
                <hr style={{ marginTop: "2rem", opacity: ".2" }} />
                <h5>
                    <b>Transactions</b>
                </h5>
                {transactionsLoading ? (
                    <p className="grey-text text-darken-1">Fetching transactions...</p>
                ) : (
                        <>
                            <p className="grey-text text-darken-1">
                                You have <b>{transactionsData.length}</b> transactions from your
                <b> {accounts.length}</b> linked
                {accounts.length > 1 ? (
                                    <span> accounts </span>
                                ) : (
                                        <span> account </span>
                                    )}
                                from the past 30 days
              </p>
                            <MaterialTable
                                columns={transactionsColumns}
                                data={transactionsData}
                                title="Search Transactions"
                            />
                        </>
                    )}
            </div>
        </div>
    );
}

export default Accounts;