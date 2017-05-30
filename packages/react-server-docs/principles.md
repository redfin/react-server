# Design Principles

First off, I’d like to lay out the principles/beliefs that drive this proposal:


1. **Best practices for data flow in React are changing fast**. Last year, Facebook announced Flux as a design pattern, and they eventually released an implementation, which had some definite rough spots (singletons, string actions, lots of boilerplate). A bunch of other implementations that use the same basic model with different ideas have cropped up since then. This year, Facebook announced Relay as a design pattern, and they say they eventually would like to open source that, too, but it’s clear that a lot of teams at Facebook still use Flux without Relay. Everything is changing pretty fast, and any data flow we use now will probably change pretty radically in the next two years. As David Nolen said at ReactJSConf: “The whole point of the Flux architecture was, “Here’s one way because we’re not sure yet what the right way is”. And in fact, the truth is this is software, there’s probably going to be 4 or 5 ways that address different dimensions of the problem.”

1. **None of the currently available solutions for data flow is perfect**. I think of the things I’ve heard about, Relay has the best story, but it would require a TON of work on both front-end and back-end to implement for Redfin, and I don’t think we should do that now. All of the other solutions have strengths and drawbacks.

1. **Flux’s one-way data flow is its best idea**. The core problem that Flux seems to be solving is not having tons of boilerplate code in your components that pass props and handlers up and down the tree. Global actions allow nodes in the component tree to send messages to the data, which eventually bubbles up and causes a re-render.

1. **Other libraries did a better job implementing Flux’s pattern than Facebook did.** Libraries like reflux and Hoverboard have tried to address some of the implementation weaknesses of Facebook’s stock Flux, and we should use their best insights. The biggest weaknesses of Flux that I see are:

 * Stores and the dispatcher are singletons, which is especially problematic for server-side rendering.
 * Actions are represented by globally unique strings.
 * Common use cases like firing an action require a lot of boilerplate.
 * Stores are often used as React props, leaking their API to components.

1. **Actions are not necessary on the server.** Server-side rendering is a point-in-time rendering of the component tree, not a living, mutating UX, as it is on the client. Actions are really only needed for the latter.

1. **Immutable data is a great tool, but we have to support mutable data**. I think immutable data structures are an insanely good match for React, and we should migrate towards them. However, we have mutable data models right now, and we shouldn’t require teams to port from those models just to get rendering in Triton. I want any data flow we use right now to be compatible with immutable data, but I think to start we will be using it with mutable objects.

1. **Passing Props Down Through the Component Tree Is Not That Bad**. This is probably the most controversial thing I believe. I agree that it’d be nicer not to pass down props, and I would love to have Relay’s solution to the problem if I had a magic wand. However, in a practical matter I don’t think it’s that difficult to manage: most changes that are made to endpoints (like adding a field to CorgiHome) will filter down automatically through the component tree without changing anything, our component trees aren’t generally that deep, and prop passing code is not particularly hard to write or understand when you do need to add it.
