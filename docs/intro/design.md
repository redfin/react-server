1. **Best practices for data flow in React are (still) changing fast**. When
   Facebook announced Flux as a design pattern, it took them some time to
   release an implementation, and when they did, it had some definite rough
   spots (singletons, string actions, lots of boilerplate). A bunch of other
   implementations that used the same basic model with different ideas had
   cropped up ([redux](redux.js.org), [mobx](https://github.com/mobxjs/mobx),
   [alt](http://alt.js.org/)), and Facebook announced
   [Relay](https://facebook.github.io/relay/) as a design pattern, and open
   sourced that, too, but it was clear at the time that a lot of teams at
   Facebook were still using (and are still using) Flux without Relay. When we
   started writing react-server, everything was changing pretty fast (and it
   still is!), and any data flow we started with was bound to change pretty
   radically in the first two years of development, and we suspect will continue
   to change. As David Nolen said at ReactJSConf: “The whole point of the Flux
   architecture was, “Here’s one way because we’re not sure yet what the right
   way is”. And in fact, the truth is this is software, there’s probably going
   to be 4 or 5 ways that address different dimensions of the problem.”

1. **None of the available solutions for data flow was perfect**. We
   suspected that Relay has the best story, but it was unrealistic to move to
   Relay all in one go internally.  Every solution has strengths and drawbacks.

1. **Flux’s one-way data flow is its best idea**. The core problem that Flux
   seemed to be solving was not having tons of boilerplate code in your
   components that pass props and handlers up and down the tree. Global
   actions allow nodes in the component tree to send messages to the data,
   which eventually bubbles up and causes a re-render.  One-way data flow makes
   reasoning about complex applications much easier.

1. **Other libraries did a better job implementing Flux’s pattern than
   Facebook did.** Libraries like [reflux](https://github.com/reflux/refluxjs)
   and [Hoverboard](https://github.com/jesseskinner/hoverboard) were trying to
   address some of the implementation weaknesses of Facebook’s stock Flux, and
   we tried to use their best insights. The biggest weaknesses of Flux that we
   saw when we started were:

 * Stores and the dispatcher are singletons, which is especially problematic for server-side rendering.
 * Actions are represented by globally unique strings.
 * Common use cases like firing an action require a lot of boilerplate.
 * Stores are often used as React props, leaking their API to components.

1. **Actions are not necessary on the server.** Server-side rendering is a
   point-in-time rendering of the component tree, not a living, mutating UX,
   as it is on the client. Actions are really only needed for the latter.

1. **Immutable data is a great tool, but we have to support mutable data**.
   Immutable data structures are an insanely good match for React, and
   we are migrating towards them. However, we started on this project with
   mutable data models, and we couldn’t require our teams to port from those
   models just to get rendering in react-server. We chose a data flow to be
   compatible with immutable data, but had to support mutable objects.

1. **Passing Props Down Through the Component Tree Is Not That Bad**. It would
   be nicer not to pass down props, and it would have been magical to ship
   Relay’s solution out of the gate. However, we live in the real world, and
   in practice it’s not that difficult to manage trees of react components by
   passing data through props.  Most changes that are made to endpoints (like
   adding a field) will filter down automatically through the component tree
   without modifying anything or being modified, component trees aren’t
   generally that deep, and code to pass props is not particularly hard to write
   or understand when needed.
