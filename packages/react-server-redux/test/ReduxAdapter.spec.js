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

test.beforeEach(t => {
	t.context.store = createStore(testReducer);
	t.context.storeAdapter = new ReduxAdapter(t.context.store);
});

test.cb('ReduxAdapter when resolves immediately when there are no pending values', t => {
	t.context.storeAdapter.when([]).then(() => {
		t.end();
	});
});

test.cb('ReduxAdapter when resolves when the pending value is ready', t => {
	t.context.storeAdapter.when(['testValue']).then((state) => {
		t.is(state.testValue, 'foo');
		t.end();
	});

	t.context.store.dispatch({type: TEST_ACTION_TYPE, value: 'foo'});
});
