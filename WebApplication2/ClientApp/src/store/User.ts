﻿import { Action, Reducer } from 'redux';
import { AppThunkAction } from './';

// -----------------
// STATE - This defines the type of data maintained in the Redux store.

export interface UserState {
    isLoading: boolean;
    user: User;
}

export interface User {
    endDate?: string;
    password: string;
    username: string;
}

// -----------------
// ACTIONS - These are serializable (hence replayable) descriptions of state transitions.
// They do not themselves have any side-effects; they just describe something that is going to happen.

interface RequestUserAction {
    type: 'REQUEST_USER';
    username: string;
}

interface ReceiveUserAction {
    username: string;
    type: 'RECEIVE_USER';
    user: User;
}

// Declare a 'discriminated union' type. This guarantees that all references to 'type' properties contain one of the
// declared type strings (and not any other arbitrary string).
type KnownAction = RequestUserAction | ReceiveUserAction;

// ----------------
// ACTION CREATORS - These are functions exposed to UI components that will trigger a state transition.
// They don't directly mutate state, but they can have external side-effects (such as loading data).

export const actionCreators = {
    requestUser: (username: string): AppThunkAction<KnownAction> => (dispatch, getState) => {
        // Only load data if it's something we don't already have (and are not already loading)
        const appState = getState();
        var now = new Date();
        var endDate = appState.user && appState.user.user.endDate ? new Date(appState.user.user.endDate) : new Date();
        if (appState && appState.user && (appState.user.user.username != username || now > endDate)) {
            fetch(`user?username=${username}`)
                .then(response => response.json() as Promise<User>)
                .then(data => {
                    dispatch({
                        username,
                        type: 'RECEIVE_USER', user: data
                    });
                });

            dispatch({ type: 'REQUEST_USER', username: username });
        }
    }
};

// ----------------
// REDUCER - For a given state and action, returns the new state. To support time travel, this must not mutate the old state.

const unloadedState: UserState = {
    user: {
        username: '', password: ''
    }, isLoading: false
};

export const reducer: Reducer<UserState> = (state: UserState | undefined, incomingAction: Action): UserState => {
    if (state === undefined) {
        return unloadedState;
    }

    const action = incomingAction as KnownAction;
    switch (action.type) {
        case 'REQUEST_USER':
            return {
                ...state,
                user: state.user,
                isLoading: true
            };
        case 'RECEIVE_USER':
            // Only accept the incoming data if it matches the most recent request. This ensures we correctly
            // handle out-of-order responses.
            return {
                user: action.user,
                isLoading: false
            };
        default:
            return state
    }
};
