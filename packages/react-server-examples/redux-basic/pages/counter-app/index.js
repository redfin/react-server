import React from 'react'
import { RootElement } from 'react-server'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import Counter from '../../components/Counter'
import reducer from './reducer'
import store from '../store'

export default class CounterPage {
  getElements() {
    const counterPromise = Counter.init();

    const storeUpdatedPromise = counterPromise.then( (count) => {
      store.dispatch({type: 'INIT', val: count})
      return count;
    });

    return [
      <RootElement key={0} when={storeUpdatedPromise}>
        <Provider store={store}>
          <Counter
            value={store.getState()}
            onIncrement={() => store.dispatch({ type: 'INCREMENT' })}
            onDecrement={() => store.dispatch({ type: 'DECREMENT' })}
          />
        </Provider>
      </RootElement>
    ]
  }

  getMetaTags() {
    return [
      {charset: 'utf8'},
      {'http-equiv': 'x-ua-compatible', 'content': 'ie=edge'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {name: 'description', content: 'Redux Counter app, powered by React Server'},
      {name: 'generator', content: 'React Server'},
    ]
  }
}
