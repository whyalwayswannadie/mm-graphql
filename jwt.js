const jwt         = require('jsonwebtoken')
function jwtCheck(req, secret) {
    const authorization = req && req.headers && req.headers.authorization 

    if (authorization && authorization.startsWith('Bearer ')){
        const token = authorization.substr("Bearer ".length)
        const decoded = jwt.verify(token, secret)
        return decoded
    }
}

module.exports = {
    jwtGQL: ({anonSchema, anonResolvers={}, schema, rootValue={},secret, createContext, graphiql=true}, _jwtCheck=jwtCheck) => 
        async (req, res, gql) => { 
            let decoded;
            if (decoded = _jwtCheck(req, secret)){
                let context  = await createContext(decoded.sub)
                context.jwt  = decoded.sub

                return {
                    schema,
                    rootValue, 
                    graphiql,
                    context
                };
            }
            return {
                schema: anonSchema,
                rootValue: anonResolvers,
                graphiql, 
            }
        },

    jwtGQLAnon: ({schema, rootValue={},secret, createContext, graphiql=true, anonJwtSub={id: "anon"}}, _jwtCheck=jwtCheck) => 
        async (req, res, gql) => { 
            let decoded = _jwtCheck(req, secret) || {sub: anonJwtSub}
            
            let context  = await createContext(decoded.sub)
            context.jwt  = decoded.sub

            return {
                schema,
                rootValue, 
                graphiql,
                context
            };
        },
    jwtCheck,
}
