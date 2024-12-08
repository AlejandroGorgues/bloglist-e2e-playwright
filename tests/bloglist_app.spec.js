const { test, expect, describe, beforeEach } = require('@playwright/test')
const { loginWith, createBlog, clickInBlog } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({page, request})=>{
    await request.post('/api/testing/reset')
    await request.post('/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    })

    await request.post('/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai2',
        password: 'salainen2'
      }
    })

    await page.goto('/')
  })

  test('login form is shown', async ({ page }) => {
    await expect(page.getByText('Log in to application')).toBeVisible()
    await expect(page.getByText('username')).toBeVisible()
    await expect(page.getByText('password')).toBeVisible()
    await expect(page.getByText('login')).toBeVisible()
  })

  describe('Login', () =>{
    
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
      await expect(page.getByText('Matti Luukkainen logged-in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'wrong')
      
      const errorDiv = page.locator('.error')
      await expect(errorDiv).toContainText('Wrong credentials')
      await expect(errorDiv).toHaveCSS('border-style', 'solid')
      await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')
  
      await expect(page.getByText('Matti Luukkainen logged in')).not.toBeVisible()
    })

    describe('When logged in', () => {
      beforeEach(async ({page})=>{
        await loginWith(page, 'mluukkai', 'salainen')
      })
      test('a new blog can be created', async ({ page }) => {
        await createBlog(page, 'a blog created by playwright', 'author', 'url')
        await expect(page.getByText(/^a blog created by playwright/i), { exact: true }).toBeVisible()
      })

      test('a blog can be liked', async ({ page }) => {
        await createBlog(page, 'a second blog created by playwright', 'author', 'url')
        await page.getByRole('button', { name: 'view' }).click()
        await page.getByRole('button', { name: 'like' }).click()
        await expect(page.getByText('likes 1')).toBeVisible()
      })

      test('a created blog can be deleted', async ({ page }) => {
        page.on('dialog', async dialog => {
          if (dialog.message().includes('Remove')) {
              console.log(`clicking "Yes" to ${dialog.message()}`)
              await dialog.accept() // press "Yes"
          } else {
              await dialog.dismiss() // press "No"
          }
        })
        await createBlog(page, 'a third blog created by playwright', 'author', 'url')
        await page.getByText(/^a third blog created by playwright/i)
                  .getByRole('button', { name: 'view' }).click()
        await page.getByRole('button', { name: 'remove' }).click()
        
        await expect(page.getByText(/^a third blog created by playwright/i), { exact: true }).not.toBeVisible()
      })

      test('only user that created blog can deleted it', async ({ page }) => {
        await createBlog(page, 'a third blog created by playwright', 'author', 'url')
        await page.evaluate(() => window.localStorage.clear())
        await page.reload()
        await loginWith(page, 'mluukkai2', 'salainen2')
        page.getByText(/^a third blog created by playwright/i)
            .getByRole('button', { name: 'view' }).click()
        await expect(page.getByRole('button', { name: 'remove' })).not.toBeVisible()        
      })

      test('blogs are ordered by likes', async ({ page }) => {
        const blogsInitialOrder = ['a first blog created by playwright', 'a third blog created by playwright', 'a second blog created by playwright']
        const blogsFinalOrder = ['a first blog created by playwright', 'a second blog created by playwright', 'a third blog created by playwright']
        await createBlog(page, blogsInitialOrder[0], 'author1', 'url1')
        await createBlog(page, blogsInitialOrder[1], 'author2', 'url2')
        await createBlog(page, blogsInitialOrder[2], 'author3', 'url3')

        await clickInBlog(page, /^a first blog created by playwright/i, 'view')
        await clickInBlog(page, /^a first blog created by playwright/i, 'like')
        await clickInBlog(page, /^a first blog created by playwright/i, 'like')
        await clickInBlog(page, /^a first blog created by playwright/i, 'like')

        await clickInBlog(page, /^a second blog created by playwright/i, 'view')
        await clickInBlog(page, /^a second blog created by playwright/i, 'like')
        await clickInBlog(page, /^a second blog created by playwright/i, 'like')
        
        const blogs = await page.getByTestId("blog-list").locator('div.blog').all()
        
        for(const [index, blog] of blogs.entries()){
          await expect(blog.getByText(blogsFinalOrder[index])).toBeVisible()
        }
      })
    })
  })
})