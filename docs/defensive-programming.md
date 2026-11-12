# Defensive Programming

The input validation and failure handling this group added from Engineering
Software Products ch. 8.

## Rules

<Each input field you validate and the rule you defined for it, e.g., "A
username is 3–20 characters, starts with a letter, and contains only letters,
digits, and underscores." At least one rule must be your own: a format, range,
or consistency check specific to your product. A framework's built-in email or
required-field check may be your second rule, but not both.>

## Implementation

<How each rule is enforced, with permalinks to the relevant code, and the
method from Table 8.8 it uses: a regular expression, type coercion, an
explicit comparison, or a framework's validator function.>

## Tests

<Permalinks to the tests for each rule, showing at least one valid input
accepted and at least one invalid input rejected, and the URL of a CI run
where they pass.>

## Failure Handling

<The external call you chose, e.g., to your microservice, a third-party API,
or your database; what can go wrong with it, e.g., an error code, a timeout,
or an invalid result; and how your code handles it so the application does
not hang or crash and the user is told what happened, with permalinks.>

## How to Try It

<Steps a reader can follow in the running application to see an input
rejected, e.g., which page to open, what to enter, and what message should
appear.>
