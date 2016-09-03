# React Server docs

Welcome to the React Server docs!  React Server assumes a separate back end
server to serve a JSON api that it can call to get its data, and is a
bring-your-own Flux implementation stack.  At Redfin, we use
[Spring MVC](http://docs.spring.io/spring/docs/current/spring-framework-reference/html/mvc.html)
and [Reflux](https://github.com/reflux/refluxjs), respectively, but it shouldn't
matter what technology you chose for either.  Choosing a tech stack is out of
scope for our documentation, but come swing by our [slack](https://slack.react-server.io/) if you'd like to talk
about it.

If you still aren't convinced on React Server, check out our
[Why React Server](https://react-server.io/docs/intro/why-react-server) doc, which explains why you might want
to use React Server, and the [Design Doc](https://react-server.io/docs/intro/design), which explains why we
built React Server and some of the decisions we made along the way.

To get started working with a new React Server project, you'll probably want to
check out the [Writing pages guide](https://react-server.io/docs/guides/writing-pages) first, which details how
to create a new web page in a React Server app.  You'll also want to check out
the [Page API](https://react-server.io/docs/page-api), and you may want to also check out
[Writing Middleware](https://react-server.io/docs/guides/writing-middleware), which explains how to write code
that runs for every route.

To dig deeper into understanding React Server, you may want to learn about
[how logging works](https://react-server.io/docs/guides/logging), [client transitions](https://react-server.io/docs/guides/client-transitions),
and [understanding rendering](https://react-server.io/docs/guides/understanding-rendering).
