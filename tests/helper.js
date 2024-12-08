const loginWith = async (page, username, password)  => {
    await page.getByRole('button', { name: 'login' }).click()
    await page.getByTestId('username').fill(username)
    await page.getByTestId('password').fill(password)
    await page.getByRole('button', { name: 'login' }).click()
}
  

const createBlog = async (page, title, author, url) => {
    await page.getByRole('button', { name: 'new blog' }).click()
    await page.getByTestId('author').fill(author)
    await page.getByTestId('url').fill(url)
    await page.getByTestId('title').fill(title)
    await page.getByRole('button', { name: 'save' }).click()
    await page.getByText(new RegExp(`^${title}`, "i")).waitFor()
}

const clickInBlog = async (page, title, buttonText) => {
    await page.getByText(title).getByRole('button', { name: buttonText }).click()
}
  export { loginWith, createBlog, clickInBlog }