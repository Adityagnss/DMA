# AgriMart

AgriMart revolutionizes the way you buy and sell agricultural products. Connect directly with farmers, access fresh produce, and enjoy a seamless shopping experience. Empowering farmers, enhancing access. AgriMart – your farm-to-table solution.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Voice Commands](#voice-commands)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Project Overview

AgriMart is a MERN stack project aimed at connecting consumers directly with farmers to buy and sell agricultural products. This platform enhances access to fresh produce and empowers farmers by providing a direct sales channel.

## Features

- **Direct Farmer Connections:** Connect directly with local farmers to purchase fresh agricultural products.
- **Seamless Shopping Experience:** User-friendly interface for browsing and purchasing products.
- **Enhanced Access:** Improved access to fresh produce for consumers and direct market access for farmers.
- **Voice Command System:** Use voice commands to navigate and perform actions in the Farmer Dashboard.
- **Secure Payment Processing:** Integrated with Braintree for secure payment processing.
- **Product Management:** Farmers can easily add, edit, and delete their products.
- **Order Management:** Track and manage orders between farmers and consumers.
- **User Authentication:** Secure login and registration system with JWT authentication.

## Technologies Used

- **MongoDB:** Database for storing user and product information.
- **Express.js:** Backend framework for building the server and API.
- **React:** Frontend library for building the user interface.
- **Node.js:** Runtime environment for server-side JavaScript execution.
- **Firebase:** Used for storage and authentication.
- **Bootstrap:** Frontend framework for responsive design.
- **Braintree:** Payment gateway integration.
- **React Speech Recognition:** For voice command functionality.

## Installation

To set up the project locally, follow these steps:

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/Agri-Mart.git
   ```

2. **Navigate to the project directory:**
   ```sh
   cd Agri-Mart
   ```

3. **Install server dependencies:**
   ```sh
   npm install
   ```

4. **Install client dependencies:**
   ```sh
   cd client
   npm install
   ```

5. **Set up environment variables:**
   Create a `.env` file in the root directory based on the `.env.example` file and add your configuration values.

6. **Start the server:**
   ```sh
   cd ..
   npm run server
   ```

7. **Start the client:**
   Open a new terminal window and navigate to the project directory:
   ```sh
   npm run client
   ```

## Usage

- Visit `http://localhost:3000` to view the AgriMart frontend.
- Register as a user to start buying or selling agricultural products.
- Browse available products, add items to your cart, and complete your purchase.
- Farmers can add new products to sell directly to consumers.

## Voice Commands

The Farmer Dashboard implements voice commands with the following features:

1. **"List produce":** Navigates to create produce page
2. **"Delete produce":** Finds and deletes produce by name
3. **"Show orders":** Displays farmer's orders
4. **"Help":** Displays available commands and usage instructions
5. **Toggle voice recognition** with continuous listening
6. Provides immediate feedback on command recognition and execution

To use voice commands:
- Navigate to the Farmer Dashboard
- Click the microphone icon to activate voice recognition
- Speak one of the available commands clearly
- The system will provide feedback and execute the command

## Deployment

To deploy the application:

1. **Prepare your environment variables:**
   - Create a production-ready `.env` file with all necessary variables
   - Make sure to use secure values for production environment

2. **Build the client:**
   ```sh
   cd client
   npm run build
   ```

3. **Deploy to hosting platform:**
   The application can be deployed to platforms like Heroku, Netlify, or Vercel.

   **For Heroku deployment:**
   ```sh
   heroku create
   git push heroku main
   ```

   **For Netlify/Vercel:**
   - Connect your GitHub repository to the platform
   - Configure build settings according to platform requirements
   - Deploy using the platform's dashboard

## Project Structure

```
Agri-Mart/
│
├── client/                # React frontend
│   ├── public/            # Public assets
│   └── src/               # React components and application logic
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components
│       ├── context/       # React context providers
│       └── ...
│
├── config/                # Configuration files
├── controllers/           # Request handlers
├── models/                # Mongoose models
├── routes/                # API routes
├── middlewares/           # Express middlewares
├── helpers/               # Helper functions
├── services/              # Service modules
├── scripts/               # Utility scripts
│
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore file
├── package.json           # Project dependencies and scripts
├── server.js              # Express server entry point
└── README.md              # This README file
```

## Contributing

Contributions are welcome! If you have any suggestions or improvements, please create a pull request or open an issue.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


