const express = require('express');
const { v4: uuidV4 } = require('uuid');

const app = express();

app.use(express.json());


const customers = []

//middleware 
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find(
        (customer) => customer.cpf === cpf
    )

    if (!customer) {
        return response.status(400).json({ error: 'Customer not found' })
    }

    request.customer = customer;

    return next()
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount
        } else {
            return acc - operation.amount
        }
    }, 0)

    return balance
}

app.get('/account', (req, res) => {
    return res.json(customers)
})
/**
 * Create account method
 * receive:
 * cpf : string
 * name: string
 * id : uuid (universal unique identifier - use v4 version) yarn add uuid
 * statement : []
 */
app.post('/account', (request, response) => {
    const { cpf, name } = request.body;
    // const id = uuidV4();

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        return response.status(400).json({ error: 'Customer already exists' })
    }

    customers.push({
        cpf,
        name,
        id: uuidV4(),
        statement: []
    });

    return response.status(201).send("Customer successfully created");
})

/**
 * Get statement for a customer
 * cpf
 */
app.get('/statement/:cpf', (request, response) => {
    const { cpf } = request.params;

    const customer = customers.find(
        (customer) => customer.cpf === cpf
    )

    if (!customer) {
        return response.status(400).json({ error: 'Customer not found' })
    }

    if (customer.statement === null) {
        return response.status(404).json({ error: 'Statement not found' })
    }

    return response.json(customer.statement)
})

/**
 * Using Headers params and Middleware
 * app.use(verifyIfExistsAccountCPF)
 */
app.get('/statement/', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request; //pegar o request passado no middleware verifyIfExistsAccountCPF

    if (customer.statement === null) {
        return response.status(404).json({ warning: 'Statement not found' })
    }

    return response.json(customer.statement)
})

/**
 * Deposit Statement
 * cpf : headers params
 * description: body
 * amount; body
 * create_at: current date
 * type: credit
 * statement :["deposit"]
 */
app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { description, amount } = request.body;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation)

    return response.status(201).send("Successfuly Deposit")
})

/**
 * amout
 * check balance
 */
app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement)

    if (balance < amount) {
        return response.status(400).send("Insufficient balance")
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperation)

    return response.status(201).send("Successfully withdraw")

})

/**
 * Get statement by date
 */
app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
    const { data } = request.query;
    const { customer } = request;

    const dateFormat = new Date(date + "00:00");

    const statement = customer.statement.filter((statement) => {
        statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    })

    if (statement === null) {
        return response.status(400).json({ error: "statement not found" })
    }
    return response.json(statement)
})

/**
 * Update account
 */
app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.send()
})

/**
 * Get account details
 */
app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer)
})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement)

    if (balance > 0) {
        return response.status(400).json({ message: "Withdraw all balance for this account", status: balance })
    }

    customers.splice(customer, 1)

    return response.json(customers)
})

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement)

    if (balance > 0) {
        return response.json({ status: balance })
    }
    return response.json({ status: 0 })

})

app.listen(3030);
