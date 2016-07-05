# React Server docs

Welcome to the React Server docs!  React Server assumes a separate back end
server to serve a JSON api that it can call to get its data, and is a
bring-your-own Flux implementation stack.  At Redfin, we use
[Spring MVC](http://docs.spring.io/spring/docs/current/spring-framework-reference/html/mvc.html)
and [Reflux](https://github.com/reflux/refluxjs), respectively, but it shouldn't
matter what technology you chose for either.  Choosing a tech stack is out of
scope for our documentation, but come swing by our gitter if you'd like to talk
about it.

If you still aren't convinced on React Server, check out our
[Why React Server](/docs/why-react-server.md) doc, which explains why you might want
to use React Server, and the [Design Doc](/docs/design.md), which explains why we
built React Server and some of the decisions we made along the way.

To get started working with a new React Server project, you'll probably want to
check out the [Writing pages guide](/docs/writing-pages.md) first, which details how
to create a new web page in a React Server app.  You'll also want to check out
the [Page API](/docs/page-api.md), and you may want to also check out
[Writing Middleware](/docs/writing-middleware.md), which explains how to write code
that runs for every route.

To dig deeper into understanding React Server, you may want to learn about
[how logging works](/docs/logging.md), [client transitions](docs/client-transitions.md),
and [understanding rendering](/docs/understanding-rendering.md).
