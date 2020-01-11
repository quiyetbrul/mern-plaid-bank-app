import { combineReducers } from 'redux';
import errorReducer from './errorReducer';
import authReducer from './authReducer';
import accountReducer from './accountReducer';

export default combineReducers({
    auth: authReducer,
    errors: errorReducer,
    plaid: accountReducer
});
