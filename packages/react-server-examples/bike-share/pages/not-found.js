import React from 'react';
import {RootElement} from 'react-server';

import Header from '../components/header';
import Footer from '../components/footer';

import '../styles/index.scss';

export default class NotFoundPage {
  handleRoute () {
    return {code: 404, hasDocument: true};
  }

  getElements () {
    return [
      <RootElement key={0}>
        <Header/>
      </RootElement>,
      <RootElement>
        <div>404 - The page you were looking for was not found.</div>
      </RootElement>,
      <RootElement key={3}>
        <Footer/>
      </RootElement>,
    ]
  }
}
