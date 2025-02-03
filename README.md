# Clankeye

Clankeye is an API gateway designed for collectors who want to find specific items across multiple  online platforms at once.

## Features

- **Unified Product Grid**: A grid-based interface displaying products from multiple marketplaces in a single view.
- **Multi-Marketplace Search**: Search for specific items across various popular e-commerce platforms.
- **Filter & Sort**: Refine search results by price, personal wishlist, filtered words and other relevant filters.
- **Real-time Data Aggregation**: Fetch and display data from various marketplaces, including product details, prices, and images.

## How It Works

Clankeye integrates with multiple marketplaces by using APIs (or web scraping techniques) to collect relevant product data. It then aggregates this data in a unified format and displays it in a product grid for easy browsing.

The backend (API gateway) connects to these different marketplaces and fetches item data, while the frontend presents the data in a simple user interface.

## Supported Marketplaces

- [![eBay](https://upload.wikimedia.org/wikipedia/commons/a/a4/eBay_Logo_2012.svg)](https://www.ebay.com) **eBay** (Soon)
- [![OLX PT](https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/OLX_logo.svg/1200px-OLX_logo.svg.png)](https://www.olx.pt) **OLX PT**
- [![Vinted](https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Vinted_logo.svg/1200px-Vinted_logo.svg.png)](https://www.vinted.pt) **Vinted** (Soon)
- [![Wallapop](https://upload.wikimedia.org/wikipedia/commons/6/6b/Wallapop_logo.png)](https://www.wallapop.com) **Wallapop** (Soon)
- [![Todo Coleccion](https://upload.wikimedia.org/wikipedia/commons/0/07/TodoColeccion_logo.png)](https://www.todocoleccion.net) **Todo Coleccion** (Soon)
- [![Leboncoin](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Le_Boncoin_logo.svg/1200px-Le_Boncoin_logo.svg.png)](https://www.leboncoin.fr) **Leboncoin** (Soon)
- [![OLX Brasil](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/OLX_logo.svg/1200px-OLX_logo.svg.png)](https://www.olx.com.br) **OLX Brasil** (Soon)
- [![OLX Poland](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/OLX_logo.svg/1200px-OLX_logo.svg.png)](https://www.olx.pl) **OLX Poland** (Soon)


## Getting Started

To get started with Clankeye locally, follow the steps below:

### Prerequisites

- Node.js (preferably v16 or later)
- NPM (Node Package Manager)
- Your own API keys for the marketplaces you wish to integrate with

### Installation

- git clone https://github.com/yourusername/clankeye.git
- cd clankeye
- npm install
- cd frontend
- npm start
- cd backend
- npm start
- visit http://localhost:4000
   
## Disclaimer

**Important:** Clankeye is a tool primarily designed for educational and personal use. It utilizes public APIs and web scraping techniques to collect data from multiple e-commerce platforms. **This project may violate the terms of service (TOS) of some of the platforms**, as it scrapes or interacts with their data in ways they might not approve of. Use at your own risk and make sure to review the terms of service of any platform you integrate with.

This project is **not intended for commercial use**, and the primary goal is to provide a learning resource to those interested in exploring APIs, web scraping, and e-commerce data aggregation.

We do not encourage any actions that would harm the stability of external websites or violate their policies. Always use this tool responsibly and consider reaching out to the respective platforms for permission or proper API access when necessary.

## License

Clankeye is licensed under the MIT License.

