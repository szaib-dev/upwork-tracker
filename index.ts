type Gener<T extends object> = T extends {name: infer N, value: infer V} ? {
    Name: string
    Value: string
} : never


const hello: Gener<{name: string, value: string}> = {
    Name: "nan",
    Value: "heelo"
}