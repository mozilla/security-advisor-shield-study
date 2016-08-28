#Security Advisor
Add-on prototype for warning users when their accounts may have been compromised. Provides
a warning whenever a user visits a site on the add-on's compromised site list.
Uses haveibeenpwned.com API to load in compromised site list. Can also use Normandy recipes
to add to list of compromised sites, as well as local data.

# To build an XPI
```bash
$ npm run build
```

This will create `@security-advisor-0.0.*.xpi`, which you can install in Firefox.

Alternatively, use jpm run to have jpm start a new instance of Firefox with add-on loaded:
```bash
$ npm run styles
$ npm run webpack
$ jpm run
```

#To use
With the add-on installed, navigate to any of the sites victim to major hackings within
the past several years, such as Adobe. See full list at haveibeenpwned.com.

# License
This add-on is licensed under the MPLv2. See the `LICENSE` file for details.
