# Build a Banking Web App with Plaid & the MERN Stack

The app will allow users to

- Link multiple bank accounts
- Remove bank accounts
- View transactions from all linked accounts in a searchable and filterable data table

## Plaid API Overview

[Plaid API Docs](https://plaid.com/docs/api)

We’ll be using Plaid to allow users to link their accounts and to gain access to their transactional data. The Plaid API [glossary](https://plaid.com/docs/#glossary) is useful for understanding the different terms referenced below.

Our Plaid flow will go as follows.

- User links a bank account within app, causing our app’s **public key** to be sent to Plaid
- Plaid responds with a **public token**, which is unique for each sign in and expires in 30 minutes
- We send our public token to our back-end server, exchanging it for an **access token** and *item id* (each bank account has a unique access token and item id)
- We’ll save this access token, item id and a few other fields in our database (while checking for duplicate accounts)
- We’ll send our **access token**, **client id**, and **client secret** to Plaid to get the user’s transactions

## Account.js

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AccountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  accessToken: {
    type: String,
    required: true
  },
  itemId: {
    type: String,
    required: true
  },
  institutionId: {
    type: String,
    required: true
  },
  institutionName: {
    type: String
  },
  accountName: {
    type: String
  },
  accountType: {
    type: String
  },
  accountSubtype: {
    type: String
  }
});
module.exports = Account = mongoose.model("account", AccountSchema);
```

## Create Plaid API routes

## plaid.js

```js
const express = require("express");
const plaid = require("plaid");
const router = express.Router();
const passport = require("passport");
const moment = require("moment");
const mongoose = require("mongoose");
// Load Account and User models
const Account = require("../../models/Account");
const User = require("../../models/User");
const PLAID_CLIENT_ID = "YOUR_CLIENT_ID";
const PLAID_SECRET = "YOUR_SECRET";
const PLAID_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const client = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  plaid.environments.development,
  { version: "2018-05-22" }
);
var PUBLIC_TOKEN = null;
var ACCESS_TOKEN = null;
var ITEM_ID = null;
// Routes will go here
module.exports = router;
```

## Adding Accounts

Our flow for adding accounts will go as follows.

- Parse `PUBLIC_TOKEN` and other data from request
- Exchange `PUBLIC_TOKEN` for an `ACCESS_TOKEN`; we don’t need to save our `PUBLIC_TOKEN` in the database (expires after 30 minutes), but we will store the `ACCESS_TOKEN` so we can get transactions and other account-specific data
- Check if the account already exists for that specific user using `userId` and `institutionId`
- If the account doesn’t already exist, save it to our database

```js
router.post(
  "/accounts/add",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    PUBLIC_TOKEN = req.body.public_token;
const userId = req.user.id;
const institution = req.body.metadata.institution;
    const { name, institution_id } = institution;
if (PUBLIC_TOKEN) {
      client
        .exchangePublicToken(PUBLIC_TOKEN)
        .then(exchangeResponse => {
          ACCESS_TOKEN = exchangeResponse.access_token;
          ITEM_ID = exchangeResponse.item_id;
// Check if account already exists for specific user
          Account.findOne({
            userId: req.user.id,
            institutionId: institution_id
          })
            .then(account => {
              if (account) {
                console.log("Account already exists");
              } else {
                const newAccount = new Account({
                  userId: userId,
                  accessToken: ACCESS_TOKEN,
                  itemId: ITEM_ID,
                  institutionId: institution_id,
                  institutionName: name
                });
newAccount.save().then(account => res.json(account));
              }
            })
            .catch(err => console.log(err)); // Mongo Error
        })
        .catch(err => console.log(err)); // Plaid Error
    }
  }
);
```

## Deleting Accounts

Users may want to remove, or “unlink”, specific bank accounts. Place the following below the previous route in `plaid.js`.

```js
router.delete(
    "/accounts/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        Account.findById(req.params.id).then(account => {
            // Delete account
            account.remove().then(() => res.json({ success: true }));
        });
    }
);
```

## Fetching All Accounts

We want to be able to get all bank accounts that a specific user has linked so we can display them upon logging in.

```js
router.get(
  "/accounts",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Account.find({ userId: req.user.id })
      .then(accounts => res.json(accounts))
      .catch(err => console.log(err));
  }
);
```

## Fetching Transactions

We’ll want to fetch transactions for each account a user has linked.

- For each account a user has linked, use that account’s `ACCESS_TOKEN` to `getTransactions` from the past 30 days
- Push object onto an array containing the `institutionName` and all transactions

Place the following in `plaid.js` as our final route.

```js
router.post(
  "/accounts/transactions",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const now = moment();
    const today = now.format("YYYY-MM-DD");
    const thirtyDaysAgo = now.subtract(30, "days").format("YYYY-MM-DD"); // Change this if you want more transactions
let transactions = [];
const accounts = req.body;
if (accounts) {
      accounts.forEach(function(account) {
        ACCESS_TOKEN = account.accessToken;
        const institutionName = account.institutionName;
client
          .getTransactions(ACCESS_TOKEN, thirtyDaysAgo, today)
          .then(response => {
            transactions.push({
              accountName: institutionName,
              transactions: response.transactions
            });
// Don't send back response till all transactions have been added
if (transactions.length === accounts.length) {
              res.json(transactions);
            }
          })
          .catch(err => console.log(err));
      });
    }
  }
);
```

# Redux

## Defining Types

Make the following additions to the `types.js` file in the `actions` client directory.

```js
export const ADD_ACCOUNT = "ADD_ACCOUNT";
export const DELETE_ACCOUNT = "DELETE_ACCOUNT";
export const GET_ACCOUNTS = "GET_ACCOUNTS";
export const ACCOUNTS_LOADING = "ACCOUNTS_LOADING";
export const GET_TRANSACTIONS = "GET_TRANSACTIONS";
export const TRANSACTIONS_LOADING = "TRANSACTIONS_LOADING";
```

## Redux Actions

## accountActions.js

```js
import axios from "axios";
import {
  ADD_ACCOUNT,
  DELETE_ACCOUNT,
  GET_ACCOUNTS,
  ACCOUNTS_LOADING,
  GET_TRANSACTIONS,
  TRANSACTIONS_LOADING
} from "./types";
// Actions will go here
```

## Account Actions

We’ll have an action for `addAccount`, `deleteAccount` and `getAccounts`.

Our flow for adding accounts will go as follows.

- Parse accounts from request and send it to our `/accounts/add` endpoint
- Concatenate the new account to our current accounts array and call `getTransactions` on the new accounts array (we’ll create `getTransactions` shortly)

```js
// Add account
export const addAccount = plaidData => dispatch => {
  const accounts = plaidData.accounts;
  axios
    .post("/api/plaid/accounts/add", plaidData)
    .then(res =>
      dispatch({
        type: ADD_ACCOUNT,
        payload: res.data
      })
    )
    .then(data =>
      accounts ? dispatch(getTransactions(accounts.concat(data.payload))) : null
    )
    .catch(err => console.log(err));
};
```

Our flow for deleting accounts will be similar. We filter out the deleted account from the accounts array before calling `getTransactions`.

```js
// Delete account
export const deleteAccount = plaidData => dispatch => {
  if (window.confirm("Are you sure you want to remove this account?")) {
    const id = plaidData.id;
    const newAccounts = plaidData.accounts.filter(
      account => account._id !== id
    );
    axios
      .delete(`/api/plaid/accounts/${id}`)
      .then(res =>
        dispatch({
          type: DELETE_ACCOUNT,
          payload: id
        })
      )
      .then(newAccounts ? dispatch(getTransactions(newAccounts)) : null)
      .catch(err => console.log(err));
  }
};
```

And finally, our `getAccounts` action.

```js
// Get all accounts for specific user
export const getAccounts = () => dispatch => {
  dispatch(setAccountsLoading());
  axios
    .get("/api/plaid/accounts")
    .then(res =>
      dispatch({
        type: GET_ACCOUNTS,
        payload: res.data
      })
    )
    .catch(err =>
      dispatch({
        type: GET_ACCOUNTS,
        payload: null
      })
    );
};
// Accounts loading
export const setAccountsLoading = () => {
  return {
    type: ACCOUNTS_LOADING
  };
};
```

## Transaction Actions

Our `getTransactions` action follows an identical flow to `getAccounts`.

```js
// Get Transactions
export const getTransactions = plaidData => dispatch => {
    dispatch(setTransactionsLoading());
    axios
        .post("/api/plaid/accounts/transactions", plaidData)
        .then(res =>
            dispatch({
                type: GET_TRANSACTIONS,
                payload: res.data
            })
        )
        .catch(err =>
            dispatch({
                type: GET_TRANSACTIONS,
                payload: null
            })
        );
};
// Transactions loading
export const setTransactionsLoading = () => {
    return {
        type: TRANSACTIONS_LOADING
    };
};
```

## Redux Reducers

## accountReducer.js

```js
import {
  ADD_ACCOUNT,
  DELETE_ACCOUNT,
  GET_ACCOUNTS,
  ACCOUNTS_LOADING,
  GET_TRANSACTIONS,
  TRANSACTIONS_LOADING
} from "../actions/types";
const initialState = {
  accounts: [],
  transactions: [],
  accountsLoading: false,
  transactionsLoading: false
};
export default function(state = initialState, action) {
  switch (action.type) {
    case ACCOUNTS_LOADING:
      return {
        ...state,
        accountsLoading: true
      };
    case ADD_ACCOUNT:
      return {
        ...state,
        accounts: [action.payload, ...state.accounts]
      };
    case DELETE_ACCOUNT:
      return {
        ...state,
        accounts: state.accounts.filter(
          account => account._id !== action.payload
        )
      };
    case GET_ACCOUNTS:
      return {
        ...state,
        accounts: action.payload,
        accountsLoading: false
      };
    case TRANSACTIONS_LOADING:
      return {
        ...state,
        transactionsLoading: true
      };
    case GET_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload,
        transactionsLoading: false
      };
    default:
      return state;
  }
}
```

# React Components

## App.css

```css
.main-btn {
  width: 185px;
  letter-spacing: 1.5px;
  border-radius: 3px;
  margin-top: 1rem;
}
.btn:hover {
  opacity: 0.8;
}
```

## Dashboard.js

```js
import React, { useState, useEffect } from "react";
import PlaidLinkButton from "react-plaid-link-button";
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from "../../actions/authActions";
import Accounts from './Accounts';
import { getAccounts, addAccount } from "../../actions/accountActions";

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
        dashboardContent = <p className="center-align">Loading...</p>;
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
                                clientName: "Paul's Bank",
                                key: "557f9aa663c8330e7d6e22b6cf4d1b",
                                env: "development",
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
```

## Accounts.js

```js
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
                        key: "557f9aa663c8330e7d6e22b6cf4d1b",
                        env: "development",
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
```

## Landing.js

```js
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import credit_card from "../../img/credit_card.png";

const Landing = (props) => {

    const auth = useSelector(state => state.auth);

    useEffect(() => {
        // If logged in and user navigates to Landing page, should redirect them to dashboard
        if (auth.isAuthenticated) {
            props.history.push("/dashboard");
        }
    }, [auth.isAuthenticated, props.history])


    return (
        <div style={{ height: "75vh" }} className="container valign-wrapper">
            <div className="row">
                <div className="col s12 center-align">
                    <img
                        src={credit_card}
                        style={{ width: "350px" }}
                        className="responsive-img credit-card"
                        alt="Undraw"
                    />
                    <h4 className="flow-text">
                        A <b>personal banking web app</b> with Plaid and the{" "}
                        <span style={{ fontFamily: "monospace" }}>MERN</span> stack
                    </h4>
                    <br />
                    <div className="col s6">
                        <Link
                            to="/register"
                            style={{
                                width: "140px",
                                borderRadius: "3px",
                                letterSpacing: "1.5px"
                            }}
                            className="btn btn-large waves-effect waves-light hoverable blue accent-3"
                        >
                            Register
                        </Link>
                    </div>
                    <div className="col s6">
                        <Link
                            to="/login"
                            style={{
                                width: "140px",
                                borderRadius: "3px",
                                letterSpacing: "1.5px"
                            }}
                            className="btn btn-large btn-flat waves-effect white black-text"
                        >
                            Log In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Landing;
```

## App.css

```css
.credit-card {
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0% {
    transform: translatey(0px);
  }
  50% {
    transform: translatey(-10px);
  }
  100% {
    transform: translatey(0px);
  }
}
```

# Deploy to Heroku

## Server.js

Add `const path = require('path');`

![Server.js](images/server-js.png)

## package.json

![Heroku postbuild](images/heroku-postbuild.png)

## Next steps

Sign up for Heroku. Download Heroku CLI.

From command line:

```bash
heroku login
heroku create (get app name)
git init
heroku git:remote -a <app-name>
git add .
git commit -am "message"
git push heroku (or git push heroku master)
```

Go to Heroku dashboard, elect app, click Open App button.

