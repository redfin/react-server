const test = require('ava');
const {createStore} = require('redux');
const {ReduxAdapter} = require('../index.js');

const TEST_ACTION_TYPE = 'ACTION_TEST_VALUE';

function testReducer(state = {}, action) {
	switch (action.type) {
		case TEST_ACTION_TYPE:
			return Object.assign({}, state, {
				testValue: action.value,
			});
		default:
			return state;
	}
}

let store;
let storeAdapter;

test.beforeEach(t => {
	store = createStore(testReducer);
	storeAdapter = new ReduxAdapter(store);
});

test.cb('ReduxAdapter when resolves immediately when there are no pending values', t => {
	storeAdapter.when([]).then(() => {
		t.end();
	});
});

test.cb('ReduxAdapter when resolves when the pending value is ready', t => {
	storeAdapter.when(['testValue']).then((state) => {
		t.is(state.testValue, 'foo');
		t.end();
	});

	store.dispatch({type: TEST_ACTION_TYPE, value: 'foo'});
});
