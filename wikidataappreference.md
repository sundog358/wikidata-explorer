# 🤖📚 Wikidata-Powered AI eBook Generator

This document outlines the architecture and workflow for building an AI-driven system that generates high-quality, well-referenced eBooks using the Wikidata knowledge base. The system prioritizes data accuracy, comprehensive referencing, and a user-friendly interface, ensuring a meticulously sourced and structured eBook. We will use Next.js latest stable version.

## 🚀 Tech Stack & Rationale

| Technology         | Description                                                                 | Role                                                                                                               | Why?                                                                                    |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Next.js (Frontend) | React framework for building user interfaces with SSR, SSG, and API routes. | Handles user interaction, topic input, eBook preview/download, and dynamic content updates.                        | Robust, performant, and SEO-friendly framework with excellent developer experience.     |
| React Query        | Data-fetching and caching library.                                          | Manages API calls to the FastAPI backend efficiently, ensuring smooth, responsive interactions.                    | Simplifies state management and improves frontend performance.                          |
| FastAPI (Backend)  | High-performance Python framework for APIs.                                 | Handles data orchestration, communicates with LangChain agents, formats eBook content, and generates bibliography. | Well-suited for asynchronous workflows and AI-based pipelines.                          |
| LangChain          | Framework for building applications powered by language models.             | Executes data retrieval, entity resolution, content generation using LLMs, and reference mapping.                  | Modular and designed for integrating large language models into workflows.              |
| Wikidata REST API  | RESTful interface to access Wikidata's structured knowledge graph.          | Primary source for data, providing item properties, statements, references, and sitelinks.                         | Comprehensive and structured data source for generating high-quality content.           |
| Tailwind CSS       | Utility-first CSS framework.                                                | Ensures clean, responsive, and easily customizable frontend design.                                                | Enables rapid UI development and easy customization.                                    |
| Optional: Pinecone | Vector database for semantic search.                                        | Stores and retrieves Wikidata embeddings for advanced search and retrieval.                                        | Enhances search capabilities, allowing for semantic matching even with imprecise input. |

## 📝 System Architecture & Workflow

The system follows a well-defined pipeline to ensure high-quality content generation. This document outlines the full architecture and workflow for building an AI-driven system to generate high-quality eBooks from the Wikidata knowledge base. The system prioritizes data quality, comprehensive referencing, and a user-friendly interface to deliver meticulously sourced content.

### Core Technologies:

- **Next.js (Frontend with React Query)**

  - **Why?** Provides a robust frontend framework with server-side rendering (SSR), static site generation (SSG), and API routes for optimal performance.
  - **Role:** Handles user interactions, topic input, and eBook preview/download.
  - **React Query:** Efficiently manages data fetching and caching from the FastAPI backend.

- **FastAPI (Backend & Workflow Orchestration)**

  - **Why?** High-performance Python framework suitable for handling asynchronous requests and AI integrations.
  - **Role:** Manages API calls, processes data, formats content, and orchestrates the pipeline.

- **LangChain (AI Agent Framework)**

  - **Why?** A modular framework designed for building AI-powered pipelines.
  - **Role:** Executes data retrieval, entity resolution, content generation, and reference mapping.

- **Wikidata REST API (Primary Knowledge Source)**

  - **Why?** Provides structured access to Wikidata's vast knowledge graph via RESTful endpoints.
  - **Role:** Supplies the raw data for content generation, including item properties, statements, references, and sitelinks.

- **Tailwind CSS (Styling)**
  - **Why?** Utility-first CSS framework for building a clean and responsive user interface.
  - **Role:** Simplifies styling for the eBook generator's frontend.

This section details each step of the workflow, emphasizing how the components work together to generate an eBook.

## 1. 📝 User Input (Frontend with Next.js)

### Steps:

1. **User Opens the Next.js Web App**

   - **Action**: The user navigates to the web app built with Next.js.
   - **UI Elements**: Display a clean and intuitive interface for topic input and preferences.

2. **Inputs the Desired Topic for the eBook**

   - **Input Field**: Provide a prominent input field for users to enter their desired eBook topic.
   - **Example**: "The History of Artificial Intelligence."

3. **Selects Additional Preferences (Optional)**

   - **Preferred Language**:

     - **Dropdown Menu**: Include a dropdown menu for users to select their preferred language.
     - **Options**: English, Spanish, French, etc.

   - **Output Structure**:

     - **Radio Buttons/Checkboxes**: Allow users to choose the output structure (e.g., chapters, bullet points, narrative).
     - **Examples**:
       - Chapters: Structured with headings and subheadings.
       - Bullet Points: Concise and to-the-point information.
       - Narrative: A flowing, story-like format.

   - **Citation Style**:
     - **Dropdown Menu**: Let users select their preferred citation style.
     - **Options**: APA, MLA, Chicago, etc.

### UI Enhancements:

- **Responsive Design**: Ensure the app is responsive and accessible on various devices (desktops, tablets, mobile phones).
- **Visual Cues**: Use visual cues (e.g., icons, tooltips) to guide users through the input process.
- **User Feedback**: Provide real-time feedback as users input their preferences (e.g., "Your topic has been noted", "Language set to English").

By following these steps, the user interface will be intuitive and user-friendly, enhancing the overall user experience. 😊

## 2. 🕵️‍♂️ Topic Identification (FastAPI Backend)

### Steps:

1. **The Topic is Sent to the FastAPI Backend**

   - **Action**: Once the user inputs the topic, it is sent to the FastAPI backend for processing.
   - **Example**: User inputs "The History of Artificial Intelligence."

2. **FastAPI Constructs Wikidata API Requests to Search for Entities Matching the Topic**

   - **API Request Construction**: FastAPI constructs API requests to query the Wikidata knowledge base.
   - **Example API Calls**:
     - `/w/api.php?action=wbsearchentities&search=<topic>&language=en&format=json`
     - `/entities/items/<item_id>` (to retrieve detailed entity data).

3. **Multiple API Queries are Executed to Expand the Topic's Scope**

   - **Related Entities**: FastAPI executes multiple queries to retrieve related entities.
     - **Example**: For the topic "AI," it retrieves related technologies, people, organizations.
   - **Data Points**:

     - **Labels**: The name of the entities.
     - **Descriptions**: Brief descriptions of the entities.
     - **Aliases**: Alternative names or titles for the entities.
     - **Sitelinks**: Links to related articles or external resources.

     ### Enhancements:

#### Disambiguation

- **Implement Disambiguation Handling**:
  - **Multiple Entities**: Wikidata often returns multiple entities for a given search term.
  - **User Selection**: Present these options to the user in the UI (Next.js) for selection.
  - **Sophisticated Disambiguation**: Use a more sophisticated disambiguation method within LangChain (e.g., using descriptions or context to choose the most likely entity).

#### Fallback Search Mechanism

- **Fallback Mechanism**:
  - **Broader Search**: Implement a broader search if the initial Wikidata search yields no results.
  - **Related Term Suggestions**: Provide feedback to the user about the fallback strategy.

#### Search Refinement Options

- **Allow Search Refinement**:
  - **Keywords Addition**: Allow users to refine their search by adding keywords.
  - **Entity Type Specification**: Allow specifying entity types to improve precision of results.

---

## 3. 📦 Data Retrieval & Structuring (LangChain Agents)

This step focuses on utilizing LangChain agents to efficiently retrieve and structure the data obtained from Wikidata.

### Steps:

1. **LangChain Agents Handle Data Retrieval and Entity Processing**

   - **Extract**:
     - **Labels**: Titles and names for entities.
     - **Descriptions**: Summaries of items.
     - **Statements**: Key facts with qualifiers.
     - **References**: Links to sources.
   - **Follow Linked Data**: Retrieve related entities for richer content and a more comprehensive eBook.

2. **Agents Organize Data into Structured Components for the eBook**

   - **Chapters, Sections, or Themes**:
     - **Example**:
       - **Chapter 1**: Early History of AI.
       - **Chapter 2**: Key Contributors and Discoveries.
       - **Chapter 3**: Current Trends.

3. **Data Quality Checks**
   - **Remove Irrelevant or Poorly Referenced Data**: Ensure that only high-quality, relevant data is included.
   - **Use Qualifiers**: Apply qualifiers (e.g., date, location) to ensure context accuracy and enrich the content.

#### Property Prioritization/Filtering

- **Prioritize/Filter Properties**:
  - **User Selection**: Allow users to select specific properties to include or exclude.
  - **AI-Driven Prioritization**: Implement an AI-driven mechanism to prioritize properties based on the topic.
  - **Example**: For historical figures, properties like "date of birth" and "place of birth" are usually important.

#### Handling Different Data Types

- **Handle Diverse Data Types**:
  - **Data Conversion**: Ensure agents can handle different data types correctly and convert them into appropriate formats for content generation.

#### Fact Verification (Optional)

- **Integrate Fact Verification**:
  - **External Sources**: Use external sources or cross-referencing within Wikidata to enhance accuracy.

## 4. 📚 Content Generation (LangChain & LLMs)

### Steps:

1. **LangChain Agents Leverage LLMs (e.g., GPT, OpenAI Models) to Create Readable, Human-Like Content**

   - **Example Prompt**:
     - "Generate a section on the history of AI, using the following data: [data here]. Include clear references."

2. **Each Sentence is Tied to its Corresponding Wikidata Source For**:

   - **Transparency**: Ensuring that each piece of information can be traced back to its source.
   - **Traceability**: Allowing users to verify the accuracy of the content by referring to the original Wikidata entries.

3. **Generate the Content Structure**:
   - **Introduction, Chapters, Subsections**:
     - **Introduction**: Overview of the eBook and its objectives.
     - **Chapters**: Detailed sections on various aspects of the topic.
     - **Subsections**: Further breakdown of chapters into specific themes or time periods.
   - **Example**:
     - **Chapter 1**: Early History of AI.
     - **Chapter 2**: Key Contributors and Discoveries.
     - **Chapter 3**: Current Trends.
4. **Add Cross-References Where Applicable**:
   - **Cross-Referencing**: Create links between related sections to enhance the reader's understanding and provide a cohesive narrative.
   - **Example**: Referencing a key contributor in multiple chapters where their work is relevant.

#### Contextualized Prompts

- **Provide Contextualized Prompts**:
  - **Narrative Context**: Structure raw data into a narrative context for the LLM.
  - **Example**: "Write a paragraph about Alan Turing's contributions to computer science, focusing on his work during World War II. Here's some relevant information: [data]."

#### Content Style and Tone Control

- **Specify Style and Tone**:
  - **User Preferences**: Allow users to specify the desired style and tone (e.g., formal, informal, technical, narrative).
  - **LLM Parameters**: Experiment with different LLM parameters (e.g., temperature, top_p) to achieve the desired output.

#### Plagiarism Detection (Optional)

- **Integrate Plagiarism Detection**:
  - **Originality Check**: Use plagiarism detection tools to ensure the generated content is original.

## 5. 📚 Referencing & Bibliography Generation (FastAPI)

### Steps:

1. **FastAPI Organizes References for Each Statement or Section**

   - **Reference Collection**: FastAPI gathers all references corresponding to each statement or section within the eBook.
   - **Structured Organization**: References are structured based on their association with specific content pieces.

2. **References are Formatted According to the Selected Citation Style**

   - **Citation Styles**:
     - **APA**: Author, year, title, URL.
     - **MLA**: Author, title, publisher, date.
   - **Formatting Process**: FastAPI applies the selected citation style to each reference, ensuring consistency and accuracy.

3. **A Comprehensive Bibliography is Appended to the eBook**
   - **Bibliography Compilation**: FastAPI compiles a comprehensive bibliography, listing all references used throughout the eBook.
   - **Appendix**: The bibliography is appended to the end of the eBook, providing readers with detailed source information.

#### Multiple Citation Styles

- **Support Multiple Citation Styles**:
  - **Styles**: APA, MLA, Chicago, etc.
  - **User Selection**: Allow users to select their preferred style.

#### Customizable Bibliography Format

- **Customizable Bibliography**:
  - **Format Options**: Provide options to customize the bibliography format (e.g., including annotations, sorting by different criteria).

## 6. 📖 Formatting the eBook (FastAPI)

### Steps:

1. **The Backend Formats the Generated Content into a Complete eBook**:

   - **Output Formats**: The eBook can be exported in various formats, including .txt, .PDF, and ePub.
   - **Formatting Process**: FastAPI handles the formatting process, ensuring a consistent and professional layout.

2. **Content is Divided into Chapters, Sections, and Subsections**:
   - **Structured Organization**: Content is organized into clearly defined chapters, sections, and subsections for readability and coherence.

### Example Structure:

# Chapter 1: Introduction to AI

- **AI Defined**: Overview of artificial intelligence.
- **Early Development (1950s–1970s)**: Key milestones in the early stages of AI development.

# Chapter 2: Key Figures in AI

- **Alan Turing**: Contributions and impact on the field of AI.
- **John McCarthy**: Inventions and influence in AI research.

# Bibliography:

- **Source 1**: Wikidata Q12345
- **Source 2**: Wikidata Q67890

### Bibliography:

Comprehensive Listing: A comprehensive bibliography is included, listing all sources referenced throughout the eBook.

Source Details: Each source is identified by its corresponding Wikidata entry, ensuring traceability and credibility.

#### Cover Page Generation

- **Generate Cover Page**:
  - **AI Image Generation**: Use AI tools (e.g., DALL-E, Stable Diffusion) to generate cover images based on the topic.

#### Table of Contents Generation

- **Auto-Generate TOC**:
  - **Structure-Based**: Automatically generate a table of contents based on the eBook's structure.

#### Image and Media Inclusion

- **Include Images and Media**:
  - **Image URLs**: Retrieve image URLs from Wikidata.
  - **User Uploads**: Allow users to upload their own images.

#### Accessibility Considerations

- **Ensure Accessibility**:
  - **Alt Text**: Provide alt text for images.
  - **Heading Levels**: Use appropriate heading levels to ensure the eBook is accessible to users with disabilities.

## 7. 📤 eBook Delivery (Frontend with Next.js)

### Steps:

1. **The Formatted eBook is Sent to the Next.js Frontend**

   - **Transmission**: Once the eBook is fully formatted, it is sent from the FastAPI backend to the Next.js frontend for delivery.

2. **Users Can**:

   - **Preview the Content In-Browser**:

     - **In-Browser Preview**: Provide an option for users to preview the eBook content directly within the web app, ensuring they are satisfied with the final product before downloading.

   - **Download the eBook in the Preferred Format**:

     - **Download Options**: Offer download links for users to save the eBook in various formats such as .txt, .PDF, or ePub, catering to different reading preferences.

   - **Share a Link to the eBook**:
     - **Shareable Links**: Generate a unique link that users can share with others, allowing easy access to the eBook without the need for additional downloads.

#### User Authentication (Optional)

- **Implement User Authentication**:
  - **Save Projects**: Allow users to save their eBook projects and track their generation history.
  - **Personalized Features**: Access personalized features.

#### Collaboration Features (Optional)

- **Enable Collaboration**:
  - **Multi-User Projects**: Allow multiple users to collaborate on an eBook project.

---

## General Improvements

### Enhancements:

#### Error Handling and Logging

- **Implement Robust Error Handling**:
  - **Error Logging**: Log errors for debugging and monitoring.
  - **Informative Messages**: Provide informative error messages to the user.

#### Rate Limiting

- **Implement Rate Limiting**:
  - **API Usage**: Avoid exceeding Wikidata API usage limits.

#### Testing

- **Thorough Testing**:
  - **Unit Tests**: Test individual components.
  - **Integration Tests**: Test integrated components.
  - **End-to-End Tests**: Test the entire system workflow.

#### Documentation

- **Provide Clear Documentation**:
  - **User Guides**: Clear guides for users.
  - **Developer Docs**: Comprehensive documentation for developers.

## 8. 🔗 Improving the Workflow

### Enhancements:

#### 📊 Data Quality Scoring

- **Implement a Scoring Mechanism**:
  - Rank Wikidata items based on reference quality and completeness.
  - Discard items with insufficient references to ensure high-quality content.

#### ⏳ Real-Time Updates

- **Use WebSockets or Server-Sent Events (SSE) in Next.js**:
  - Show progress updates as the eBook is generated in real-time to keep users informed and engaged.

#### 🌍 Multilingual Support

- **Allow Users to Generate eBooks in Multiple Languages**:
  - Leverage Wikidata's labels and descriptions available in various languages for multilingual eBook generation.
  - **Example**: Generate an eBook in English, Spanish, and French using the same dataset.

#### 🧠 AI-Driven Summarization

- **Use Advanced Summarization Models**:
  - Condense data-rich sections without losing meaning, ensuring concise and informative content.
  - **Example**: Summarize complex historical data into easily digestible sections.

#### 📚 Version Control for eBooks

- **Track Versions of eBooks**:
  - Enable users to update their eBooks as Wikidata evolves, maintaining up-to-date information.
  - **Version History**: Keep a history of changes and updates for each eBook.

#### 🔄 Feedback Loop

- **Allow Users to Flag Errors or Suggest Improvements**:
  - Feed user feedback back into the system for continuous learning and improvement.
  - **User Interface**: Provide an easy-to-use interface for users to submit feedback directly from the eBook reader.

---

## 🌟 Final System Overview

### Frontend (Next.js):

- **User Interface**: Clean and intuitive design for topic input and preference selection.
- **Real-Time Feedback**: Live updates and progress tracking as the eBook is generated.

### Backend (FastAPI):

- **Data Orchestration**: Manages data retrieval, formatting, and delivery.
- **Version Control**: Tracks updates and maintains a history of changes.
- **Feedback Integration**: Processes user feedback for continuous improvement.

### AI Components (LangChain & LLMs):

- **Content Generation**: Uses LLMs to create coherent and readable text.
- **Data Structuring**: Organizes content into logical chapters and sections.
- **Summarization**: Condenses detailed information into concise summaries.

### Data Source (Wikidata):

- **Knowledge Base**: Provides structured data for content generation.
- **Multilingual Support**: Accesses data in multiple languages.

This comprehensive system ensures high-quality, well-referenced, and user-friendly eBooks, leveraging advanced AI and modern web technologies. 😊

## 🌟 System Components Overview

### 🖥️ User Interface

- **Input Collection**: Users input their desired topic and preferences through a clean, intuitive interface.
- **Preview**: Users can preview the content directly within the web app.
- **Download**: Options to download the eBook in various formats (.txt, .PDF, .ePub).

### ⚙️ Backend (FastAPI)

- **Data Orchestration**: Manages the entire workflow of data retrieval and processing.
- **API Requests**: Handles communication with the Wikidata REST API for data fetching.
- **Formatting**: Organizes and formats the content into a structured eBook.
- **Workflow Automation**: Ensures smooth and efficient automation of the entire process.

### 🧠 LangChain Agents

- **Content Generation**: Leverages AI-driven models to generate coherent and readable content.
- **Data Processing**: Extracts and processes data from the retrieved Wikidata entries.

### 🌐 Wikidata REST API

- **Primary Knowledge Source**: Provides the structured data needed for generating eBook content.
- **Data Retrieval**: Accesses item properties, statements, references, and sitelinks to ensure comprehensive coverage.

### 📂 Output Formats

- **.txt, .PDF, .ePub**: Supports multiple output formats to cater to different user preferences.
- **Complete References and Bibliography**: Ensures that all references are accurately cited and a comprehensive bibliography is included.

By following this architecture, you can build a scalable, AI-powered eBook generator that maximizes data quality, user experience, and knowledge accessibility. 🌍📚✨

## 🌟 Final System Overview

### Frontend (Next.js):

- **User Interface**: Clean and intuitive design for topic input and preference selection.
- **Real-Time Feedback**: Live updates and progress tracking as the eBook is generated.

### Backend (FastAPI):

- **Data Orchestration**: Manages data retrieval, formatting, and delivery.
- **Version Control**: Tracks updates and maintains a history of changes.
- **Feedback Integration**: Processes user feedback for continuous improvement.

### AI Components (LangChain & LLMs):

- **Content Generation**: Uses LLMs to create coherent and readable text.
- **Data Structuring**: Organizes content into logical chapters and sections.
- **Summarization**: Condenses detailed information into concise summaries.

### Data Source (Wikidata):

- **Knowledge Base**: Provides structured data for content generation.
- **Multilingual Support**: Accesses data in multiple languages.

### Output Formats:

- **.txt, .PDF, .ePub**: Supports multiple output formats to cater to different user preferences.
- **Complete References and Bibliography**: Ensures that all references are accurately cited and a comprehensive bibliography is included.

By incorporating these steps and details, you can create a more robust, feature-rich, and user-friendly Wikidata-powered AI eBook generator. 🌍📚✨

### Wikidata Rest API Swagger Documentation

https://doc.wikimedia.org/Wikibase/master/js/rest-api/

Wikibase REST API
1.1
OAS 3.1
OpenAPI definition of Wikibase REST API

Wikimedia Deutschland - Wikibase Product Platform Team - Website
GNU General Public License v2.0 or later
Servers

https://wikibase.example/w/rest.php/wikibase/v1
items
Wikibase Items

Wikibase Data Model - Items

POST
/entities/items
Create a Wikibase Item

Parameters
Try it out
Name Description
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing a Wikibase Item and edit metadata

Example Value
Schema
{
"item": {
"labels": {
"en": "Jane Doe",
"ru": "Джейн Доу"
},
"descriptions": {
"en": "famous person",
"ru": "известная личность"
},
"aliases": {
"en": [
"Jane M. Doe",
"JD"
],
"ru": [
"Джейн М. Доу"
]
},
"statements": {
"P694": [
{
"property": {
"id": "P694"
},
"value": {
"type": "value",
"content": "Q626683"
}
}
],
"P476": [
{
"property": {
"id": "P476"
},
"value": {
"type": "value",
"content": {
"time": "+1986-01-27T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"P17": [
{
"property": {
"id": "P17"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"parts": [
{
"property": {
"id": "P709"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
]
},
"sitelinks": {
"enwiki": {
"title": "Jane Doe"
},
"ruwiki": {
"title": "Джейн Доу"
}
}
},
"comment": "Create an Item for Jane Doe"
}
Responses
Code Description Links
201
A single Wikibase Item

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24",
"type": "item",
"labels": {
"en": "Jane Doe",
"ru": "Джейн Доу"
},
"descriptions": {
"en": "famous person",
"ru": "известная личность"
},
"aliases": {
"en": [
"Jane M. Doe",
"JD"
],
"ru": [
"Джейн М. Доу"
]
},
"statements": {
"P694": [
{
"id": "Q24$BB728546-A400-4116-A772-16D54B62AC2B",
        "rank": "normal",
        "property": {
          "id": "P694",
          "data_type": "wikibase-item"
        },
        "value": {
          "type": "value",
          "content": "Q626683"
        },
        "qualifiers": [],
        "references": []
      }
    ],
    "P476": [
      {
        "id": "Q24$F3B2F956-B6AB-4984-8D89-BEE0FFFA3385",
"rank": "normal",
"property": {
"id": "P476",
"data*type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+1986-01-27T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
},
"qualifiers": [],
"references": []
}
],
"P17": [
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
]
},
"sitelinks": {
"enwiki": {
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
},
"ruwiki": {
"title": "Джейн Доу",
"badges": [],
"url": "https://ruwiki.example.org/wiki/Джейн*Доу"
}
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

value-too-long
Example Value
Schema
{
"code": "value-too-long",
"message": "The input value is too long",
"context": {
"path": "{json_pointer_to_element}",
"limit": "{configured_limit}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
422
The edit request violates data policy

Media type

application/json
Examples

data-policy-violation
Example Value
Schema
{
"code": "data-policy-violation",
"message": "Edit violates data policy",
"context": {
"violation": "{violation_code}",
"violation_context": {
"some": "context"
}
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}
Retrieve a single Wikibase Item by ID

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
\_fields
array[string]
(query)
Comma-separated list of fields to include in each response object.

Available values : type, labels, descriptions, aliases, statements, sitelinks

--typelabelsdescriptionsaliasesstatementssitelinks
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A single Wikibase Item

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24",
"type": "item",
"labels": {
"en": "Jane Doe",
"ru": "Джейн Доу"
},
"descriptions": {
"en": "famous person",
"ru": "известная личность"
},
"aliases": {
"en": [
"Jane M. Doe",
"JD"
],
"ru": [
"Джейн М. Доу"
]
},
"statements": {
"P694": [
{
"id": "Q24$BB728546-A400-4116-A772-16D54B62AC2B",
        "rank": "normal",
        "property": {
          "id": "P694",
          "data_type": "wikibase-item"
        },
        "value": {
          "type": "value",
          "content": "Q626683"
        },
        "qualifiers": [],
        "references": []
      }
    ],
    "P476": [
      {
        "id": "Q24$F3B2F956-B6AB-4984-8D89-BEE0FFFA3385",
"rank": "normal",
"property": {
"id": "P476",
"data*type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+1986-01-27T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
},
"qualifiers": [],
"references": []
}
],
"P17": [
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
]
},
"sitelinks": {
"enwiki": {
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
},
"ruwiki": {
"title": "Джейн Доу",
"badges": [],
"url": "https://ruwiki.example.org/wiki/Джейн*Доу"
}
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/items/{item_id}
Change a single Wikibase Item by ID

sitelinks
Wikibase Item Sitelinks

Wikibase Data Model - Sitelinks

GET
/entities/items/{item_id}/sitelinks
Retrieve an Item's Sitelinks

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A list of Sitelinks by Item id

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"enwiki": {
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
},
"ruwiki": {
"title": "Джейн Доу",
"badges": [],
"url": "https://ruwiki.example.org/wiki/Джейн_Доу"
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/items/{item_id}/sitelinks
Change an Item's Sitelinks

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Example Value
Schema
{
"patch": [
{
"op": "add",
"path": "/ruwiki/title",
"value": "Джейн Доу"
}
],
"tags": [],
"bot": false,
"comment": "Add sitelink to ruwiki"
}
Responses
Code Description Links
200
A list of Sitelinks by Item id

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"enwiki": {
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
},
"ruwiki": {
"title": "Джейн Доу",
"badges": [],
"url": "https://ruwiki.example.org/wiki/Джейн_Доу"
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in invalid Sitelinks

Media type

application/json
Examples

patch-result-referenced-resource-not-found
Example Value
Schema
{
"code": "patch-result-referenced-resource-not-found",
"message": "The referenced resource does not exist",
"context": {
"path": "{json_pointer_to_missing_resource_in_patch_result}",
"value": "{value}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}/sitelinks/{site_id}
Retrieve an Item's Sitelink

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
site_id \*
string
(path)
The ID of the required Site

Example : enwiki

enwiki
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A Sitelink by Item id

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PUT
/entities/items/{item_id}/sitelinks/{site_id}
Add / Replace an Item's Sitelink

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
site_id \*
string
(path)
The ID of the required Site

Example : enwiki

enwiki
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing a Wikibase Sitelink object and edit metadata

Example Value
Schema
{
"sitelink": {
"title": "Jane Doe",
"badges": []
},
"tags": [],
"bot": false,
"comment": "Add enwiki sitelink"
}
Responses
Code Description Links
200
The updated Sitelink

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
201
The newly added Sitelink

Media type

application/json
Example Value
Schema
{
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The specified Item was redirected

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

string
No links

patch-test-failed
Example Value
Schema
{
"code": "patch-test-failed",
"message": "Test operation in the provided patch failed",
"context": {
"path": "{json_pointer_to_patch_operation}",
"actual_value": "actual value"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in invalid Labels

Media type

application/json
Examples

patch-result-invalid-key
Example Value
Schema
{
"code": "patch-result-invalid-key",
"message": "Invalid key in patch result",
"context": {
"path": "{json_pointer_to_parent_in_patch_result}",
"key": "{key}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

# 🤖📚 Wikidata-Powered AI eBook Generator

This document outlines the architecture and workflow for building an AI-driven system that generates high-quality, well-referenced eBooks using the Wikidata knowledge base. The system prioritizes data accuracy, comprehensive referencing, and a user-friendly interface, ensuring a meticulously sourced and structured eBook. We will use Next.js latest stable version.

## 🚀 Tech Stack & Rationale

| Technology         | Description                                                                 | Role                                                                                                               | Why?                                                                                    |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Next.js (Frontend) | React framework for building user interfaces with SSR, SSG, and API routes. | Handles user interaction, topic input, eBook preview/download, and dynamic content updates.                        | Robust, performant, and SEO-friendly framework with excellent developer experience.     |
| React Query        | Data-fetching and caching library.                                          | Manages API calls to the FastAPI backend efficiently, ensuring smooth, responsive interactions.                    | Simplifies state management and improves frontend performance.                          |
| FastAPI (Backend)  | High-performance Python framework for APIs.                                 | Handles data orchestration, communicates with LangChain agents, formats eBook content, and generates bibliography. | Well-suited for asynchronous workflows and AI-based pipelines.                          |
| LangChain          | Framework for building applications powered by language models.             | Executes data retrieval, entity resolution, content generation using LLMs, and reference mapping.                  | Modular and designed for integrating large language models into workflows.              |
| Wikidata REST API  | RESTful interface to access Wikidata’s structured knowledge graph.          | Primary source for data, providing item properties, statements, references, and sitelinks.                         | Comprehensive and structured data source for generating high-quality content.           |
| Tailwind CSS       | Utility-first CSS framework.                                                | Ensures clean, responsive, and easily customizable frontend design.                                                | Enables rapid UI development and easy customization.                                    |
| Optional: Pinecone | Vector database for semantic search.                                        | Stores and retrieves Wikidata embeddings for advanced search and retrieval.                                        | Enhances search capabilities, allowing for semantic matching even with imprecise input. |

## 📝 System Architecture & Workflow

The system follows a well-defined pipeline to ensure high-quality content generation. This document outlines the full architecture and workflow for building an AI-driven system to generate high-quality eBooks from the Wikidata knowledge base. The system prioritizes data quality, comprehensive referencing, and a user-friendly interface to deliver meticulously sourced content.

### Core Technologies:

- **Next.js (Frontend with React Query)**

  - **Why?** Provides a robust frontend framework with server-side rendering (SSR), static site generation (SSG), and API routes for optimal performance.
  - **Role:** Handles user interactions, topic input, and eBook preview/download.
  - **React Query:** Efficiently manages data fetching and caching from the FastAPI backend.

- **FastAPI (Backend & Workflow Orchestration)**

  - **Why?** High-performance Python framework suitable for handling asynchronous requests and AI integrations.
  - **Role:** Manages API calls, processes data, formats content, and orchestrates the pipeline.

- **LangChain (AI Agent Framework)**

  - **Why?** A modular framework designed for building AI-powered pipelines.
  - **Role:** Executes data retrieval, entity resolution, content generation, and reference mapping.

- **Wikidata REST API (Primary Knowledge Source)**

  - **Why?** Provides structured access to Wikidata’s vast knowledge graph via RESTful endpoints.
  - **Role:** Supplies the raw data for content generation, including item properties, statements, references, and sitelinks.

- **Tailwind CSS (Styling)**
  - **Why?** Utility-first CSS framework for building a clean and responsive user interface.
  - **Role:** Simplifies styling for the eBook generator’s frontend.

This section details each step of the workflow, emphasizing how the components work together to generate an eBook.

## 1. 📝 User Input (Frontend with Next.js)

### Steps:

1. **User Opens the Next.js Web App**

   - **Action**: The user navigates to the web app built with Next.js.
   - **UI Elements**: Display a clean and intuitive interface for topic input and preferences.

2. **Inputs the Desired Topic for the eBook**

   - **Input Field**: Provide a prominent input field for users to enter their desired eBook topic.
   - **Example**: "The History of Artificial Intelligence."

3. **Selects Additional Preferences (Optional)**

   - **Preferred Language**:

     - **Dropdown Menu**: Include a dropdown menu for users to select their preferred language.
     - **Options**: English, Spanish, French, etc.

   - **Output Structure**:

     - **Radio Buttons/Checkboxes**: Allow users to choose the output structure (e.g., chapters, bullet points, narrative).
     - **Examples**:
       - Chapters: Structured with headings and subheadings.
       - Bullet Points: Concise and to-the-point information.
       - Narrative: A flowing, story-like format.

   - **Citation Style**:
     - **Dropdown Menu**: Let users select their preferred citation style.
     - **Options**: APA, MLA, Chicago, etc.

### UI Enhancements:

- **Responsive Design**: Ensure the app is responsive and accessible on various devices (desktops, tablets, mobile phones).
- **Visual Cues**: Use visual cues (e.g., icons, tooltips) to guide users through the input process.
- **User Feedback**: Provide real-time feedback as users input their preferences (e.g., "Your topic has been noted", "Language set to English").

By following these steps, the user interface will be intuitive and user-friendly, enhancing the overall user experience. 😊

## 2. 🕵️‍♂️ Topic Identification (FastAPI Backend)

### Steps:

1. **The Topic is Sent to the FastAPI Backend**

   - **Action**: Once the user inputs the topic, it is sent to the FastAPI backend for processing.
   - **Example**: User inputs "The History of Artificial Intelligence."

2. **FastAPI Constructs Wikidata API Requests to Search for Entities Matching the Topic**

   - **API Request Construction**: FastAPI constructs API requests to query the Wikidata knowledge base.
   - **Example API Calls**:
     - `/w/api.php?action=wbsearchentities&search=<topic>&language=en&format=json`
     - `/entities/items/<item_id>` (to retrieve detailed entity data).

3. **Multiple API Queries are Executed to Expand the Topic’s Scope**

   - **Related Entities**: FastAPI executes multiple queries to retrieve related entities.
     - **Example**: For the topic "AI," it retrieves related technologies, people, organizations.
   - **Data Points**:

     - **Labels**: The name of the entities.
     - **Descriptions**: Brief descriptions of the entities.
     - **Aliases**: Alternative names or titles for the entities.
     - **Sitelinks**: Links to related articles or external resources.

     ### Enhancements:

#### Disambiguation

- **Implement Disambiguation Handling**:
  - **Multiple Entities**: Wikidata often returns multiple entities for a given search term.
  - **User Selection**: Present these options to the user in the UI (Next.js) for selection.
  - **Sophisticated Disambiguation**: Use a more sophisticated disambiguation method within LangChain (e.g., using descriptions or context to choose the most likely entity).

#### Fallback Search Mechanism

- **Fallback Mechanism**:
  - **Broader Search**: Implement a broader search if the initial Wikidata search yields no results.
  - **Related Term Suggestions**: Provide feedback to the user about the fallback strategy.

#### Search Refinement Options

- **Allow Search Refinement**:
  - **Keywords Addition**: Allow users to refine their search by adding keywords.
  - **Entity Type Specification**: Allow specifying entity types to improve precision of results.

---

## 3. 📦 Data Retrieval & Structuring (LangChain Agents)

This step focuses on utilizing LangChain agents to efficiently retrieve and structure the data obtained from Wikidata.

### Steps:

1. **LangChain Agents Handle Data Retrieval and Entity Processing**

   - **Extract**:
     - **Labels**: Titles and names for entities.
     - **Descriptions**: Summaries of items.
     - **Statements**: Key facts with qualifiers.
     - **References**: Links to sources.
   - **Follow Linked Data**: Retrieve related entities for richer content and a more comprehensive eBook.

2. **Agents Organize Data into Structured Components for the eBook**

   - **Chapters, Sections, or Themes**:
     - **Example**:
       - **Chapter 1**: Early History of AI.
       - **Chapter 2**: Key Contributors and Discoveries.
       - **Chapter 3**: Current Trends.

3. **Data Quality Checks**
   - **Remove Irrelevant or Poorly Referenced Data**: Ensure that only high-quality, relevant data is included.
   - **Use Qualifiers**: Apply qualifiers (e.g., date, location) to ensure context accuracy and enrich the content.

#### Property Prioritization/Filtering

- **Prioritize/Filter Properties**:
  - **User Selection**: Allow users to select specific properties to include or exclude.
  - **AI-Driven Prioritization**: Implement an AI-driven mechanism to prioritize properties based on the topic.
  - **Example**: For historical figures, properties like "date of birth" and "place of birth" are usually important.

#### Handling Different Data Types

- **Handle Diverse Data Types**:
  - **Data Conversion**: Ensure agents can handle different data types correctly and convert them into appropriate formats for content generation.

#### Fact Verification (Optional)

- **Integrate Fact Verification**:
  - **External Sources**: Use external sources or cross-referencing within Wikidata to enhance accuracy.

## 4. 📚 Content Generation (LangChain & LLMs)

### Steps:

1. **LangChain Agents Leverage LLMs (e.g., GPT, OpenAI Models) to Create Readable, Human-Like Content**

   - **Example Prompt**:
     - "Generate a section on the history of AI, using the following data: [data here]. Include clear references."

2. **Each Sentence is Tied to its Corresponding Wikidata Source For**:

   - **Transparency**: Ensuring that each piece of information can be traced back to its source.
   - **Traceability**: Allowing users to verify the accuracy of the content by referring to the original Wikidata entries.

3. **Generate the Content Structure**:
   - **Introduction, Chapters, Subsections**:
     - **Introduction**: Overview of the eBook and its objectives.
     - **Chapters**: Detailed sections on various aspects of the topic.
     - **Subsections**: Further breakdown of chapters into specific themes or time periods.
   - **Example**:
     - **Chapter 1**: Early History of AI.
     - **Chapter 2**: Key Contributors and Discoveries.
     - **Chapter 3**: Current Trends.
4. **Add Cross-References Where Applicable**:
   - **Cross-Referencing**: Create links between related sections to enhance the reader's understanding and provide a cohesive narrative.
   - **Example**: Referencing a key contributor in multiple chapters where their work is relevant.

#### Contextualized Prompts

- **Provide Contextualized Prompts**:
  - **Narrative Context**: Structure raw data into a narrative context for the LLM.
  - **Example**: "Write a paragraph about Alan Turing's contributions to computer science, focusing on his work during World War II. Here's some relevant information: [data]."

#### Content Style and Tone Control

- **Specify Style and Tone**:
  - **User Preferences**: Allow users to specify the desired style and tone (e.g., formal, informal, technical, narrative).
  - **LLM Parameters**: Experiment with different LLM parameters (e.g., temperature, top_p) to achieve the desired output.

#### Plagiarism Detection (Optional)

- **Integrate Plagiarism Detection**:
  - **Originality Check**: Use plagiarism detection tools to ensure the generated content is original.

## 5. 📚 Referencing & Bibliography Generation (FastAPI)

### Steps:

1. **FastAPI Organizes References for Each Statement or Section**

   - **Reference Collection**: FastAPI gathers all references corresponding to each statement or section within the eBook.
   - **Structured Organization**: References are structured based on their association with specific content pieces.

2. **References are Formatted According to the Selected Citation Style**

   - **Citation Styles**:
     - **APA**: Author, year, title, URL.
     - **MLA**: Author, title, publisher, date.
   - **Formatting Process**: FastAPI applies the selected citation style to each reference, ensuring consistency and accuracy.

3. **A Comprehensive Bibliography is Appended to the eBook**
   - **Bibliography Compilation**: FastAPI compiles a comprehensive bibliography, listing all references used throughout the eBook.
   - **Appendix**: The bibliography is appended to the end of the eBook, providing readers with detailed source information.

#### Multiple Citation Styles

- **Support Multiple Citation Styles**:
  - **Styles**: APA, MLA, Chicago, etc.
  - **User Selection**: Allow users to select their preferred style.

#### Customizable Bibliography Format

- **Customizable Bibliography**:
  - **Format Options**: Provide options to customize the bibliography format (e.g., including annotations, sorting by different criteria).

## 6. 📖 Formatting the eBook (FastAPI)

### Steps:

1. **The Backend Formats the Generated Content into a Complete eBook**:

   - **Output Formats**: The eBook can be exported in various formats, including .txt, .PDF, and ePub.
   - **Formatting Process**: FastAPI handles the formatting process, ensuring a consistent and professional layout.

2. **Content is Divided into Chapters, Sections, and Subsections**:
   - **Structured Organization**: Content is organized into clearly defined chapters, sections, and subsections for readability and coherence.

### Example Structure:

# Chapter 1: Introduction to AI

- **AI Defined**: Overview of artificial intelligence.
- **Early Development (1950s–1970s)**: Key milestones in the early stages of AI development.

# Chapter 2: Key Figures in AI

- **Alan Turing**: Contributions and impact on the field of AI.
- **John McCarthy**: Inventions and influence in AI research.

# Bibliography:

- **Source 1**: Wikidata Q12345
- **Source 2**: Wikidata Q67890

### Bibliography:

Comprehensive Listing: A comprehensive bibliography is included, listing all sources referenced throughout the eBook.

Source Details: Each source is identified by its corresponding Wikidata entry, ensuring traceability and credibility.

#### Cover Page Generation

- **Generate Cover Page**:
  - **AI Image Generation**: Use AI tools (e.g., DALL-E, Stable Diffusion) to generate cover images based on the topic.

#### Table of Contents Generation

- **Auto-Generate TOC**:
  - **Structure-Based**: Automatically generate a table of contents based on the eBook's structure.

#### Image and Media Inclusion

- **Include Images and Media**:
  - **Image URLs**: Retrieve image URLs from Wikidata.
  - **User Uploads**: Allow users to upload their own images.

#### Accessibility Considerations

- **Ensure Accessibility**:
  - **Alt Text**: Provide alt text for images.
  - **Heading Levels**: Use appropriate heading levels to ensure the eBook is accessible to users with disabilities.

## 7. 📤 eBook Delivery (Frontend with Next.js)

### Steps:

1. **The Formatted eBook is Sent to the Next.js Frontend**

   - **Transmission**: Once the eBook is fully formatted, it is sent from the FastAPI backend to the Next.js frontend for delivery.

2. **Users Can**:

   - **Preview the Content In-Browser**:

     - **In-Browser Preview**: Provide an option for users to preview the eBook content directly within the web app, ensuring they are satisfied with the final product before downloading.

   - **Download the eBook in the Preferred Format**:

     - **Download Options**: Offer download links for users to save the eBook in various formats such as .txt, .PDF, or ePub, catering to different reading preferences.

   - **Share a Link to the eBook**:
     - **Shareable Links**: Generate a unique link that users can share with others, allowing easy access to the eBook without the need for additional downloads.

#### User Authentication (Optional)

- **Implement User Authentication**:
  - **Save Projects**: Allow users to save their eBook projects and track their generation history.
  - **Personalized Features**: Access personalized features.

#### Collaboration Features (Optional)

- **Enable Collaboration**:
  - **Multi-User Projects**: Allow multiple users to collaborate on an eBook project.

---

## General Improvements

### Enhancements:

#### Error Handling and Logging

- **Implement Robust Error Handling**:
  - **Error Logging**: Log errors for debugging and monitoring.
  - **Informative Messages**: Provide informative error messages to the user.

#### Rate Limiting

- **Implement Rate Limiting**:
  - **API Usage**: Avoid exceeding Wikidata API usage limits.

#### Testing

- **Thorough Testing**:
  - **Unit Tests**: Test individual components.
  - **Integration Tests**: Test integrated components.
  - **End-to-End Tests**: Test the entire system workflow.

#### Documentation

- **Provide Clear Documentation**:
  - **User Guides**: Clear guides for users.
  - **Developer Docs**: Comprehensive documentation for developers.

## 8. 🔗 Improving the Workflow

### Enhancements:

#### 📊 Data Quality Scoring

- **Implement a Scoring Mechanism**:
  - Rank Wikidata items based on reference quality and completeness.
  - Discard items with insufficient references to ensure high-quality content.

#### ⏳ Real-Time Updates

- **Use WebSockets or Server-Sent Events (SSE) in Next.js**:
  - Show progress updates as the eBook is generated in real-time to keep users informed and engaged.

#### 🌍 Multilingual Support

- **Allow Users to Generate eBooks in Multiple Languages**:
  - Leverage Wikidata's labels and descriptions available in various languages for multilingual eBook generation.
  - **Example**: Generate an eBook in English, Spanish, and French using the same dataset.

#### 🧠 AI-Driven Summarization

- **Use Advanced Summarization Models**:
  - Condense data-rich sections without losing meaning, ensuring concise and informative content.
  - **Example**: Summarize complex historical data into easily digestible sections.

#### 📚 Version Control for eBooks

- **Track Versions of eBooks**:
  - Enable users to update their eBooks as Wikidata evolves, maintaining up-to-date information.
  - **Version History**: Keep a history of changes and updates for each eBook.

#### 🔄 Feedback Loop

- **Allow Users to Flag Errors or Suggest Improvements**:
  - Feed user feedback back into the system for continuous learning and improvement.
  - **User Interface**: Provide an easy-to-use interface for users to submit feedback directly from the eBook reader.

---

## 🌟 Final System Overview

### Frontend (Next.js):

- **User Interface**: Clean and intuitive design for topic input and preference selection.
- **Real-Time Feedback**: Live updates and progress tracking as the eBook is generated.

### Backend (FastAPI):

- **Data Orchestration**: Manages data retrieval, formatting, and delivery.
- **Version Control**: Tracks updates and maintains a history of changes.
- **Feedback Integration**: Processes user feedback for continuous improvement.

### AI Components (LangChain & LLMs):

- **Content Generation**: Uses LLMs to create coherent and readable text.
- **Data Structuring**: Organizes content into logical chapters and sections.
- **Summarization**: Condenses detailed information into concise summaries.

### Data Source (Wikidata):

- **Knowledge Base**: Provides structured data for content generation.
- **Multilingual Support**: Accesses data in multiple languages.

This comprehensive system ensures high-quality, well-referenced, and user-friendly eBooks, leveraging advanced AI and modern web technologies. 😊

## 🌟 System Components Overview

### 🖥️ User Interface

- **Input Collection**: Users input their desired topic and preferences through a clean, intuitive interface.
- **Preview**: Users can preview the content directly within the web app.
- **Download**: Options to download the eBook in various formats (.txt, .PDF, .ePub).

### ⚙️ Backend (FastAPI)

- **Data Orchestration**: Manages the entire workflow of data retrieval and processing.
- **API Requests**: Handles communication with the Wikidata REST API for data fetching.
- **Formatting**: Organizes and formats the content into a structured eBook.
- **Workflow Automation**: Ensures smooth and efficient automation of the entire process.

### 🧠 LangChain Agents

- **Content Generation**: Leverages AI-driven models to generate coherent and readable content.
- **Data Processing**: Extracts and processes data from the retrieved Wikidata entries.

### 🌐 Wikidata REST API

- **Primary Knowledge Source**: Provides the structured data needed for generating eBook content.
- **Data Retrieval**: Accesses item properties, statements, references, and sitelinks to ensure comprehensive coverage.

### 📂 Output Formats

- **.txt, .PDF, .ePub**: Supports multiple output formats to cater to different user preferences.
- **Complete References and Bibliography**: Ensures that all references are accurately cited and a comprehensive bibliography is included.

By following this architecture, you can build a scalable, AI-powered eBook generator that maximizes data quality, user experience, and knowledge accessibility. 🌍📚✨

## 🌟 Final System Overview

### Frontend (Next.js):

- **User Interface**: Clean and intuitive design for topic input and preference selection.
- **Real-Time Feedback**: Live updates and progress tracking as the eBook is generated.

### Backend (FastAPI):

- **Data Orchestration**: Manages data retrieval, formatting, and delivery.
- **Version Control**: Tracks updates and maintains a history of changes.
- **Feedback Integration**: Processes user feedback for continuous improvement.

### AI Components (LangChain & LLMs):

- **Content Generation**: Uses LLMs to create coherent and readable text.
- **Data Structuring**: Organizes content into logical chapters and sections.
- **Summarization**: Condenses detailed information into concise summaries.

### Data Source (Wikidata):

- **Knowledge Base**: Provides structured data for content generation.
- **Multilingual Support**: Accesses data in multiple languages.

### Output Formats:

- **.txt, .PDF, .ePub**: Supports multiple output formats to cater to different user preferences.
- **Complete References and Bibliography**: Ensures that all references are accurately cited and a comprehensive bibliography is included.

By incorporating these steps and details, you can create a more robust, feature-rich, and user-friendly Wikidata-powered AI eBook generator. 🌍📚✨

### Wikidata Rest API Swagger Documentation

https://doc.wikimedia.org/Wikibase/master/js/rest-api/

Wikibase REST API
1.1
OAS 3.1
OpenAPI definition of Wikibase REST API

Wikimedia Deutschland - Wikibase Product Platform Team - Website
GNU General Public License v2.0 or later
Servers

https://wikibase.example/w/rest.php/wikibase/v1
items
Wikibase Items

Wikibase Data Model - Items

POST
/entities/items
Create a Wikibase Item

Parameters
Try it out
Name Description
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing a Wikibase Item and edit metadata

Example Value
Schema
{
"item": {
"labels": {
"en": "Jane Doe",
"ru": "Джейн Доу"
},
"descriptions": {
"en": "famous person",
"ru": "известная личность"
},
"aliases": {
"en": [
"Jane M. Doe",
"JD"
],
"ru": [
"Джейн М. Доу"
]
},
"statements": {
"P694": [
{
"property": {
"id": "P694"
},
"value": {
"type": "value",
"content": "Q626683"
}
}
],
"P476": [
{
"property": {
"id": "P476"
},
"value": {
"type": "value",
"content": {
"time": "+1986-01-27T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"P17": [
{
"property": {
"id": "P17"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"parts": [
{
"property": {
"id": "P709"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
]
},
"sitelinks": {
"enwiki": {
"title": "Jane Doe"
},
"ruwiki": {
"title": "Джейн Доу"
}
}
},
"comment": "Create an Item for Jane Doe"
}
Responses
Code Description Links
201
A single Wikibase Item

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24",
"type": "item",
"labels": {
"en": "Jane Doe",
"ru": "Джейн Доу"
},
"descriptions": {
"en": "famous person",
"ru": "известная личность"
},
"aliases": {
"en": [
"Jane M. Doe",
"JD"
],
"ru": [
"Джейн М. Доу"
]
},
"statements": {
"P694": [
{
"id": "Q24$BB728546-A400-4116-A772-16D54B62AC2B",
        "rank": "normal",
        "property": {
          "id": "P694",
          "data_type": "wikibase-item"
        },
        "value": {
          "type": "value",
          "content": "Q626683"
        },
        "qualifiers": [],
        "references": []
      }
    ],
    "P476": [
      {
        "id": "Q24$F3B2F956-B6AB-4984-8D89-BEE0FFFA3385",
"rank": "normal",
"property": {
"id": "P476",
"data*type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+1986-01-27T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
},
"qualifiers": [],
"references": []
}
],
"P17": [
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
]
},
"sitelinks": {
"enwiki": {
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
},
"ruwiki": {
"title": "Джейн Доу",
"badges": [],
"url": "https://ruwiki.example.org/wiki/Джейн*Доу"
}
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

value-too-long
Example Value
Schema
{
"code": "value-too-long",
"message": "The input value is too long",
"context": {
"path": "{json_pointer_to_element}",
"limit": "{configured_limit}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
422
The edit request violates data policy

Media type

application/json
Examples

data-policy-violation
Example Value
Schema
{
"code": "data-policy-violation",
"message": "Edit violates data policy",
"context": {
"violation": "{violation_code}",
"violation_context": {
"some": "context"
}
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}
Retrieve a single Wikibase Item by ID

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
\_fields
array[string]
(query)
Comma-separated list of fields to include in each response object.

Available values : type, labels, descriptions, aliases, statements, sitelinks

--typelabelsdescriptionsaliasesstatementssitelinks
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A single Wikibase Item

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24",
"type": "item",
"labels": {
"en": "Jane Doe",
"ru": "Джейн Доу"
},
"descriptions": {
"en": "famous person",
"ru": "известная личность"
},
"aliases": {
"en": [
"Jane M. Doe",
"JD"
],
"ru": [
"Джейн М. Доу"
]
},
"statements": {
"P694": [
{
"id": "Q24$BB728546-A400-4116-A772-16D54B62AC2B",
        "rank": "normal",
        "property": {
          "id": "P694",
          "data_type": "wikibase-item"
        },
        "value": {
          "type": "value",
          "content": "Q626683"
        },
        "qualifiers": [],
        "references": []
      }
    ],
    "P476": [
      {
        "id": "Q24$F3B2F956-B6AB-4984-8D89-BEE0FFFA3385",
"rank": "normal",
"property": {
"id": "P476",
"data*type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+1986-01-27T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
},
"qualifiers": [],
"references": []
}
],
"P17": [
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
]
},
"sitelinks": {
"enwiki": {
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
},
"ruwiki": {
"title": "Джейн Доу",
"badges": [],
"url": "https://ruwiki.example.org/wiki/Джейн*Доу"
}
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/items/{item_id}
Change a single Wikibase Item by ID

sitelinks
Wikibase Item Sitelinks

Wikibase Data Model - Sitelinks

GET
/entities/items/{item_id}/sitelinks
Retrieve an Item's Sitelinks

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A list of Sitelinks by Item id

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"enwiki": {
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
},
"ruwiki": {
"title": "Джейн Доу",
"badges": [],
"url": "https://ruwiki.example.org/wiki/Джейн_Доу"
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/items/{item_id}/sitelinks
Change an Item's Sitelinks

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Example Value
Schema
{
"patch": [
{
"op": "add",
"path": "/ruwiki/title",
"value": "Джейн Доу"
}
],
"tags": [],
"bot": false,
"comment": "Add sitelink to ruwiki"
}
Responses
Code Description Links
200
A list of Sitelinks by Item id

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"enwiki": {
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
},
"ruwiki": {
"title": "Джейн Доу",
"badges": [],
"url": "https://ruwiki.example.org/wiki/Джейн_Доу"
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in invalid Sitelinks

Media type

application/json
Examples

patch-result-referenced-resource-not-found
Example Value
Schema
{
"code": "patch-result-referenced-resource-not-found",
"message": "The referenced resource does not exist",
"context": {
"path": "{json_pointer_to_missing_resource_in_patch_result}",
"value": "{value}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}/sitelinks/{site_id}
Retrieve an Item's Sitelink

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
site_id \*
string
(path)
The ID of the required Site

Example : enwiki

enwiki
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A Sitelink by Item id

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PUT
/entities/items/{item_id}/sitelinks/{site_id}
Add / Replace an Item's Sitelink

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
site_id \*
string
(path)
The ID of the required Site

Example : enwiki

enwiki
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing a Wikibase Sitelink object and edit metadata

Example Value
Schema
{
"sitelink": {
"title": "Jane Doe",
"badges": []
},
"tags": [],
"bot": false,
"comment": "Add enwiki sitelink"
}
Responses
Code Description Links
200
The updated Sitelink

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
201
The newly added Sitelink

Media type

application/json
Example Value
Schema
{
"title": "Jane Doe",
"badges": [],
"url": "https://enwiki.example.org/wiki/Jane_Doe"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The specified Item was redirected

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
The edit request violates data policy

Media type

application/json
Examples

data-policy-violation
Example Value
Schema
{
"code": "data-policy-violation",
"message": "Edit violates data policy",
"context": {
"violation": "{violation_code}",
"violation_context": {
"some": "context"
}
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

DELETE
/entities/items/{item_id}/sitelinks/{site_id}
Delete an Item's Sitelink

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
site_id \*
string
(path)
The ID of the required Site

Example : enwiki

enwiki
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Edit payload containing edit metadata

Example Value
Schema
{
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
The resource was deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
"Sitelink deleted"
Headers:
Name Description Type
Content-Language
Language code of the language in which response is provided

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The specified Item was redirected

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
properties
Wikibase Properties

Wikibase Data Model - Properties

POST
/entities/properties
Create a Wikibase Property

Parameters
Try it out
Name Description
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing a Wikibase Property and edit metadata

Example Value
Schema
{
"property": {
"data_type": "wikibase-item",
"labels": {
"en": "instance of",
"ru": "это частный случай понятия"
},
"descriptions": {
"en": "the subject is a concrete object (instance) of this class, category, or object group",
"ru": "данный элемент представляет собой конкретный объект (экземпляр / частный случай) класса, категории"
},
"aliases": {
"en": [
"is a",
"is an"
],
"ru": [
"представляет собой",
"является"
]
},
"statements": {
"P1628": [
{
"property": {
"id": "P1628"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
}
}
]
}
}
}
Responses
Code Description Links
201
A single Wikibase Property

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "P694",
"type": "property",
"data_type": "wikibase-item",
"labels": {
"en": "instance of",
"ru": "это частный случай понятия"
},
"descriptions": {
"en": "the subject is a concrete object (instance) of this class, category, or object group",
"ru": "данный элемент представляет собой конкретный объект (экземпляр / частный случай) класса, категории."
},
"aliases": {
"en": [
"is a",
"is an"
],
"ru": [
"представляет собой",
"является"
]
},
"statements": {
"P1628": [
{
"id": "P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71",
"rank": "normal",
"property": {
"id": "P1628",
"data_type": "url"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
},
"qualifiers": [],
"references": []
}
]
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

value-too-long
Example Value
Schema
{
"code": "value-too-long",
"message": "The input value is too long",
"context": {
"path": "{json_pointer_to_element}",
"limit": "{configured_limit}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
422
The edit request violates data policy

Media type

application/json
Examples

data-policy-violation
Example Value
Schema
{
"code": "data-policy-violation",
"message": "Edit violates data policy",
"context": {
"violation": "{violation_code}",
"violation_context": {
"some": "context"
}
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}
Retrieve a single Wikibase Property by ID

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
\_fields
array[string]
(query)
Comma-separated list of fields to include in each response object.

Available values : type, data_type, labels, descriptions, aliases, statements

--typedata_typelabelsdescriptionsaliasesstatements
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A single Wikibase Property

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "P694",
"type": "property",
"data_type": "wikibase-item",
"labels": {
"en": "instance of",
"ru": "это частный случай понятия"
},
"descriptions": {
"en": "the subject is a concrete object (instance) of this class, category, or object group",
"ru": "данный элемент представляет собой конкретный объект (экземпляр / частный случай) класса, категории."
},
"aliases": {
"en": [
"is a",
"is an"
],
"ru": [
"представляет собой",
"является"
]
},
"statements": {
"P1628": [
{
"id": "P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71",
"rank": "normal",
"property": {
"id": "P1628",
"data_type": "url"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
},
"qualifiers": [],
"references": []
}
]
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/properties/{property_id}
Change a single Wikibase Property by ID

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Example Value
Schema
{
"patch": [
{
"op": "add",
"path": "/aliases/en/-",
"value": "is an"
}
],
"tags": [],
"bot": false,
"comment": "add 'is an' as an English alias"
}
Responses
Code Description Links
200
A single Wikibase Property

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "P694",
"type": "property",
"data_type": "wikibase-item",
"labels": {
"en": "instance of",
"ru": "это частный случай понятия"
},
"descriptions": {
"en": "the subject is a concrete object (instance) of this class, category, or object group",
"ru": "данный элемент представляет собой конкретный объект (экземпляр / частный случай) класса, категории."
},
"aliases": {
"en": [
"is a",
"is an"
],
"ru": [
"представляет собой",
"является"
]
},
"statements": {
"P1628": [
{
"id": "P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71",
"rank": "normal",
"property": {
"id": "P1628",
"data_type": "url"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
},
"qualifiers": [],
"references": []
}
]
}
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

patch-test-failed
Example Value
Schema
{
"code": "patch-test-failed",
"message": "Test operation in the provided patch failed",
"context": {
"path": "{json_pointer_to_patch_operation}",
"actual_value": "actual value"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in an invalid Property

Media type

application/json
Examples

patch-result-missing-field
Example Value
Schema
{
"code": "patch-result-missing-field",
"message": "Required field missing in patch result",
"context": {
"path": "{json_pointer_to_parent}",
"field": "{missing_field}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
labels
Wikibase Labels

Wikibase Data Model - Terms

GET
/entities/items/{item_id}/labels
Retrieve an Item's labels

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Item's labels by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": "Jane Doe",
"ru": "Джейн Доу"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/items/{item_id}/labels
Change an Item's Labels

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Payload containing a JSON Patch document to be applied to Labels and edit metadata

Example Value
Schema
{
"patch": [
{
"op": "replace",
"path": "/en",
"value": "Jane Doe"
}
],
"tags": [],
"bot": false,
"comment": "replace English label"
}
Responses
Code Description Links
200
Item's labels by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": "Jane Doe",
"ru": "Джейн Доу"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in invalid Labels

Media type

application/json
Examples

patch-result-invalid-key
Example Value
Schema
{
"code": "patch-result-invalid-key",
"message": "Invalid key in patch result",
"context": {
"path": "{json_pointer_to_parent_in_patch_result}",
"key": "{key}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/labels
Retrieve a Property's labels

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Property's labels by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": "instance of",
"ru": "это частный случай понятия"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/properties/{property_id}/labels
Change a Property's Labels

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Payload containing a JSON Patch document to be applied to Labels and edit metadata

Example Value
Schema
{
"patch": [
{
"op": "replace",
"path": "/en",
"value": "instance of"
}
],
"tags": [],
"bot": false,
"comment": "replace English label"
}
Responses
Code Description Links
200
Property's labels by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": "instance of",
"ru": "это частный случай понятия"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

patch-test-failed
Example Value
Schema
{
"code": "patch-test-failed",
"message": "Test operation in the provided patch failed",
"context": {
"path": "{json_pointer_to_patch_operation}",
"actual_value": "actual value"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in invalid Labels

Media type

application/json
Examples

patch-result-invalid-key
Example Value
Schema
{
"code": "patch-result-invalid-key",
"message": "Invalid key in patch result",
"context": {
"path": "{json_pointer_to_parent_in_patch_result}",
"key": "{key}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}/labels/{language_code}
Retrieve an Item's label in a specific language

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A label in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"Jane Doe"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PUT
/entities/items/{item_id}/labels/{language_code}
Add / Replace an Item's label in a specific language

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing an Item label in the specified language and edit metadata

Example Value
Schema
{
"label": "Jane Doe",
"tags": [],
"bot": false,
"comment": "Update the English label"
}
Responses
Code Description Links
200
The updated Label in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"Jane Doe"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
201
The newly added Label in a specific language

Media type

application/json
Example Value
Schema
"Jane Doe"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The specified Item was redirected

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
The edit request violates data policy

Media type

application/json
Examples

data-policy-violation
Example Value
Schema
{
"code": "data-policy-violation",
"message": "Edit violates data policy",
"context": {
"violation": "{violation_code}",
"violation_context": {
"some": "context"
}
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

DELETE
/entities/items/{item_id}/labels/{language_code}
Delete an Item's label in a specific language

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Edit payload containing edit metadata

Example Value
Schema
{
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
The resource was deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
"Label deleted"
Headers:
Name Description Type
Content-Language
Language code of the language in which response is provided

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The specified Item was redirected

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}/labels_with_language_fallback/{language_code}
Retrieve an Item's label in a specific language, with language fallback

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A label in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"Jane Doe"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
307
The specified resource has temporarily moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/labels/{language_code}
Retrieve a Property's label in a specific language

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A label in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"instance of"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PUT
/entities/properties/{property_id}/labels/{language_code}
Add / Replace a Property's label in a specific language

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing a Property label in the specified language and edit metadata

Example Value
Schema
{
"label": "instance of",
"tags": [],
"bot": false,
"comment": "Update the English label"
}
Responses
Code Description Links
200
The updated Label in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"instance of"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
201
The newly added Label in a specific language

Media type

application/json
Example Value
Schema
"instance of"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
The edit request violates data policy

Media type

application/json
Examples

data-policy-violation
Example Value
Schema
{
"code": "data-policy-violation",
"message": "Edit violates data policy",
"context": {
"violation": "{violation_code}",
"violation_context": {
"some": "context"
}
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

DELETE
/entities/properties/{property_id}/labels/{language_code}
Delete a Property's label in a specific language

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Edit payload containing edit metadata

Example Value
Schema
{
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
The resource was deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
"Label deleted"
Headers:
Name Description Type
Content-Language
Language code of the language in which response is provided

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/labels_with_language_fallback/{language_code}
Retrieve a Property's label in a specific language, with language fallback

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
A label in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"instance of"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
307
The specified resource has temporarily moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
descriptions
Wikibase Descriptions

Wikibase Data Model - Terms

GET
/entities/items/{item_id}/descriptions
Retrieve an Item's descriptions

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Item's descriptions by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": "famous person",
"ru": "известная личность"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/items/{item_id}/descriptions
Change an Item's descriptions

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Payload containing a JSON Patch document to be applied to an Item's descriptions and edit metadata

Example Value
Schema
{
"patch": [
{
"op": "replace",
"path": "/en",
"value": "famous person"
}
],
"tags": [],
"bot": false,
"comment": "update English description"
}
Responses
Code Description Links
200
Item's descriptions by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": "famous person",
"ru": "известная личность"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in invalid descriptions

Media type

application/json
Examples

patch-result-invalid-key
Example Value
Schema
{
"code": "patch-result-invalid-key",
"message": "Invalid key in patch result",
"context": {
"path": "{json_pointer_to_parent_in_patch_result}",
"key": "{key}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/descriptions
Retrieve a Property's descriptions

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Property's descriptions by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": "the subject is a concrete object (instance) of this class, category, or object group",
"ru": "данный элемент представляет собой конкретный объект (экземпляр / частный случай) класса, категории"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/properties/{property_id}/descriptions
Change a Property's descriptions

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Payload containing a JSON Patch document to be applied to a Property's descriptions and edit metadata

Example Value
Schema
{
"patch": [
{
"op": "replace",
"path": "/en",
"value": "the subject is a concrete object (instance) of this class, category, or object group"
}
],
"tags": [],
"bot": false,
"comment": "update English description"
}
Responses
Code Description Links
200
Property's descriptions by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": "the subject is a concrete object (instance) of this class, category, or object group",
"ru": "данный элемент представляет собой конкретный объект (экземпляр / частный случай) класса, категории"
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

patch-test-failed
Example Value
Schema
{
"code": "patch-test-failed",
"message": "Test operation in the provided patch failed",
"context": {
"path": "{json_pointer_to_patch_operation}",
"actual_value": "actual value"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in invalid descriptions

Media type

application/json
Examples

patch-result-invalid-key
Example Value
Schema
{
"code": "patch-result-invalid-key",
"message": "Invalid key in patch result",
"context": {
"path": "{json_pointer_to_parent_in_patch_result}",
"key": "{key}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}/descriptions/{language_code}
Retrieve an Item's description in a specific language

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Item's description in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"famous person"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PUT
/entities/items/{item_id}/descriptions/{language_code}
Add / Replace an Item's description in a specific language

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing Item description in the specified language and edit metadata

Example Value
Schema
{
"description": "famous person",
"tags": [],
"bot": false,
"comment": "set English description"
}
Responses
Code Description Links
200
The updated description

Media type

application/json
Controls Accept header.
Example Value
Schema
"famous person"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
201
The newly added description

Media type

application/json
Example Value
Schema
"famous person"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The specified Item was redirected

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
The edit request violates data policy

Media type

application/json
Examples

data-policy-violation
Example Value
Schema
{
"code": "data-policy-violation",
"message": "Edit violates data policy",
"context": {
"violation": "{violation_code}",
"violation_context": {
"some": "context"
}
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

DELETE
/entities/items/{item_id}/descriptions/{language_code}
Delete an Item's description in a specific language

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Edit payload containing edit metadata

Example Value
Schema
{
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
The description was deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
"Description deleted"
Headers:
Name Description Type
Content-Language
Language code of the language in which response is provided

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The specified Item was redirected

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}/descriptions_with_language_fallback/{language_code}
Retrieve an Item's description in a specific language, with language fallback

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Item's description in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"famous person"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
307
The specified resource has temporarily moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/descriptions/{language_code}
Retrieve a Property's description in a specific language

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Property's description in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"the subject is a concrete object (instance) of this class, category, or object group"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PUT
/entities/properties/{property_id}/descriptions/{language_code}
Add / Replace a Property's description in a specific language

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing Property description in the specified language and edit metadata

Example Value
Schema
{
"description": "the subject is a concrete object (instance) of this class, category, or object group",
"tags": [],
"bot": false,
"comment": "set English description"
}
Responses
Code Description Links
200
The updated description

Media type

application/json
Controls Accept header.
Example Value
Schema
"the subject is a concrete object (instance) of this class, category, or object group"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
201
The newly added description

Media type

application/json
Example Value
Schema
"the subject is a concrete object (instance) of this class, category, or object group"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
The edit request violates data policy

Media type

application/json
Examples

data-policy-violation
Example Value
Schema
{
"code": "data-policy-violation",
"message": "Edit violates data policy",
"context": {
"violation": "{violation_code}",
"violation_context": {
"some": "context"
}
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

DELETE
/entities/properties/{property_id}/descriptions/{language_code}
Delete a Property's description in a specific language

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Edit payload containing edit metadata

Example Value
Schema
{
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
The description was deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
"Description deleted"
Headers:
Name Description Type
Content-Language
Language code of the language in which response is provided

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/descriptions_with_language_fallback/{language_code}
Retrieve a Property's description in a specific language, with language fallback

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Property's description in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
"the subject is a concrete object (instance) of this class, category, or object group"
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
307
The specified resource has temporarily moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
aliases
Wikibase Aliases

Wikibase Data Model - Terms

GET
/entities/items/{item_id}/aliases
Retrieve an Item's aliases

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Item's aliases by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": [
"Jane M. Doe",
"JD"
],
"ru": [
"Джейн М. Доу"
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/items/{item_id}/aliases
Change an Item's aliases

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Payload containing a JSON Patch document to be applied to an Item's aliases and edit metadata

Example Value
Schema
{
"patch": [
{
"op": "add",
"path": "/en/-",
"value": "JD"
}
],
"tags": [],
"bot": false,
"comment": "Add English alias"
}
Responses
Code Description Links
200
Item's aliases by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": [
"Jane M. Doe",
"JD"
],
"ru": [
"Джейн М. Доу"
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in invalid Aliases

Media type

application/json
Examples

patch-result-invalid-value
Example Value
Schema
{
"code": "patch-result-invalid-value",
"message": "Invalid value in patch result",
"context": {
"value": "{value}",
"path": "{path}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/aliases
Retrieve a Property's aliases

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Property's aliases by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": [
"is a",
"is an"
],
"ru": [
"представляет собой",
"является"
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/properties/{property_id}/aliases
Change a Property's aliases

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Payload containing a JSON Patch document to be applied to a Property's aliases and edit metadata

Example Value
Schema
{
"patch": [
{
"op": "add",
"path": "/en/-",
"value": "is an"
}
],
"tags": [],
"bot": false,
"comment": "Add English alias"
}
Responses
Code Description Links
200
Property's aliases by language

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"en": [
"is a",
"is an"
],
"ru": [
"представляет собой",
"является"
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

patch-test-failed
Example Value
Schema
{
"code": "patch-test-failed",
"message": "Test operation in the provided patch failed",
"context": {
"path": "{json_pointer_to_patch_operation}",
"actual_value": "actual value"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in invalid Aliases

Media type

application/json
Examples

patch-result-invalid-value
Example Value
Schema
{
"code": "patch-result-invalid-value",
"message": "Invalid value in patch result",
"context": {
"value": "{value}",
"path": "{path}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}/aliases/{language_code}
Retrieve an Item's aliases in a specific language

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Item's aliases in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
[
"Jane M. Doe",
"JD"
]
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

POST
/entities/items/{item_id}/aliases/{language_code}
Create / Add an Item's aliases in a specific language

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing a list of Item aliases in the specified language and edit metadata

Example Value
Schema
{
"aliases": [
"JD"
],
"tags": [],
"bot": false,
"comment": "Add English alias"
}
Responses
Code Description Links
200
The updated list of aliases in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
[
"Jane M. Doe",
"JD"
]
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
201
The newly created list of aliases in a specific language

Media type

application/json
Example Value
Schema
[
"Jane M. Doe",
"JD"
]
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The specified Item was redirected

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/aliases/{language_code}
Retrieve a Property's aliases in a specific language

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
Property's aliases in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
[
"is a",
"is an"
]
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

POST
/entities/properties/{property_id}/aliases/{language_code}
Create / Add a Property's aliases in a specific language

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
language_code \*
string
(path)
The requested resource language

Example : en

en
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Request body

application/json
Payload containing a list of Wikibase aliases in the specified language and edit metadata

Example Value
Schema
{
"aliases": [
"is an"
],
"tags": [],
"bot": false,
"comment": "Add English alias"
}
Responses
Code Description Links
200
The updated list of aliases in a specific language

Media type

application/json
Controls Accept header.
Example Value
Schema
[
"is a",
"is an"
]
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
201
The newly created list of aliases in a specific language

Media type

application/json
Example Value
Schema
[
"is a",
"is an"
]
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
statements
Wikibase Statements

Wikibase Data Model - Statements

GET
/entities/items/{item_id}/statements
Retrieve Statements from an Item

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
property
string
(query)
Single Property ID to filter Statements by.

Example : P1628

P1628
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
The Statements of an Item

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"P694": [
{
"id": "Q24$BB728546-A400-4116-A772-16D54B62AC2B",
      "rank": "normal",
      "property": {
        "id": "P694",
        "data_type": "wikibase-item"
      },
      "value": {
        "type": "value",
        "content": "Q626683"
      },
      "qualifiers": [],
      "references": []
    }
  ],
  "P476": [
    {
      "id": "Q24$F3B2F956-B6AB-4984-8D89-BEE0FFFA3385",
"rank": "normal",
"property": {
"id": "P476",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+1986-01-27T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
},
"qualifiers": [],
"references": []
}
],
"P17": [
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
308
The specified resource has permanently moved to the indicated location

Headers:
Name Description Type
Location
The URL to which the requested resource has been moved

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

POST
/entities/items/{item_id}/statements
Add a new Statement to an Item

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
Request body

application/json
Payload containing a Wikibase Statement object and edit metadata

Example Value
Schema
{
"statement": {
"property": {
"id": "P17"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"parts": [
{
"property": {
"id": "P709"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
},
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
201
The newly created Statement. Please note that the value of the ETag header field refers to the Item's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
Location
The URI of the newly created Statement

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The specified Item was redirected

Media type

application/json
Examples

redirected-item
Example Value
Schema
{
"code": "redirected-item",
"message": "Item {item_id} has been redirected to {redirect_target_id}",
"context": {
"redirect_target": "{redirect_target_id}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/items/{item_id}/statements/{statement_id}
Retrieve a single Statement from an Item

This endpoint is also accessible through /statements/{statement_id}

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
statement_id \*
string
(path)
The ID of a Statement on an Item

Example : Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA

Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
The requested Statement. Please note that the value of the ETag header field refers to the Item's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PUT
/entities/items/{item_id}/statements/{statement_id}
Replace a single Statement of an Item

This endpoint is also accessible through /statements/{statement_id}

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
statement_id \*
string
(path)
The ID of a Statement on an Item

Example : Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA

Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json
Payload containing a Wikibase Statement object and edit metadata

Example Value
Schema
{
"statement": {
"property": {
"id": "P17"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"parts": [
{
"property": {
"id": "P709"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
},
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
A Wikibase Statement. Please note that the value of the ETag header field refers to the Item's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/items/{item_id}/statements/{statement_id}
Change elements of a single Statement of an Item

This endpoint is also accessible through /statements/{statement_id}.

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
statement_id \*
string
(path)
The ID of a Statement on an Item

Example : Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA

Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Payload containing a JSON Patch document to be applied to the Statement and edit metadata

Example Value
Schema
{
"patch": [
{
"op": "add",
"path": "/references/-",
"value": {
"parts": [
{
"property": {
"id": "P709"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
}
],
"tags": [],
"bot": false,
"comment": "Add reference to Statement"
}
Responses
Code Description Links
200
A Wikibase Statement. Please note that the value of the ETag header field refers to the Item's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

patch-test-failed
Example Value
Schema
{
"code": "patch-test-failed",
"message": "Test operation in the provided patch failed",
"context": {
"path": "{json_pointer_to_patch_operation}",
"actual_value": "actual value"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in an invalid Statement

Media type

application/json
Examples

patch-result-missing-field
Example Value
Schema
{
"code": "patch-result-missing-field",
"message": "Required field missing in patch result",
"context": {
"path": "{json_pointer_to_parent}",
"field": "{missing_field}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

DELETE
/entities/items/{item_id}/statements/{statement_id}
Delete a single Statement from an Item

This endpoint is also accessible through /statements/{statement_id}

Parameters
Try it out
Name Description
item_id \*
string
(path)
The ID of the required Item

Example : Q24

Q24
statement_id \*
string
(path)
The ID of a Statement on an Item

Example : Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA

Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json
Edit payload containing edit metadata

Example Value
Schema
{
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
The requested Statement was deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
"Statement deleted"
Headers:
Name Description Type
Content-Language
Language code of the language in which response is provided

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/statements
Retrieve Statements from a Property

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
property
string
(query)
Single Property ID to filter Statements by.

Example : P1628

P1628
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
The Statements of a Property

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"P1628": [
{
"id": "P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71",
"rank": "normal",
"property": {
"id": "P1628",
"data_type": "url"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
},
"qualifiers": [],
"references": []
}
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

POST
/entities/properties/{property_id}/statements
Add a new Statement to a Property

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
Request body

application/json
Payload containing a Wikibase Statement object and edit metadata

Example Value
Schema
{
"statement": {
"property": {
"id": "P1628"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
}
},
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
201
The newly created Statement. Please note that the value of the ETag header field refers to the Property's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71",
"rank": "normal",
"property": {
"id": "P1628",
"data_type": "url"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
},
"qualifiers": [],
"references": []
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
Location
The URI of the newly created Statement

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/entities/properties/{property_id}/statements/{statement_id}
Retrieve a single Statement from a Property

This endpoint is also accessible through /statements/{statement_id}

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
statement_id \*
string
(path)
The ID of a Statement on a Property

Example : P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71

P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
The requested Statement. Please note that the value of the ETag header field refers to the Property's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71",
"rank": "normal",
"property": {
"id": "P1628",
"data_type": "url"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
},
"qualifiers": [],
"references": []
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PUT
/entities/properties/{property_id}/statements/{statement_id}
Replace a single Statement of a Property

This endpoint is also accessible through /statements/{statement_id}

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
statement_id \*
string
(path)
The ID of a Statement on a Property

Example : P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71

P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json
Payload containing a Wikibase Statement object and edit metadata

Example Value
Schema
{
"statement": {
"property": {
"id": "P1628"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
}
},
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
A Wikibase Statement. Please note that the value of the ETag header field refers to the Property's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71",
"rank": "normal",
"property": {
"id": "P1628",
"data_type": "url"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
},
"qualifiers": [],
"references": []
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/entities/properties/{property_id}/statements/{statement_id}
Change elements of a single Statement of a Property

This endpoint is also accessible through /statements/{statement_id}.

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
statement_id \*
string
(path)
The ID of a Statement on a Property

Example : P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71

P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Payload containing a JSON Patch document to be applied to the Statement and edit metadata

Example Value
Schema
{
"patch": [
{
"op": "replace",
"path": "/value/content",
"value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
}
],
"tags": [],
"bot": false,
"comment": "Update value of the 'equivalent property' Statement"
}
Responses
Code Description Links
200
A Wikibase Statement. Please note that the value of the ETag header field refers to the Property's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71",
"rank": "normal",
"property": {
"id": "P1628",
"data_type": "url"
},
"value": {
"type": "value",
"content": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
},
"qualifiers": [],
"references": []
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

patch-test-failed
Example Value
Schema
{
"code": "patch-test-failed",
"message": "Test operation in the provided patch failed",
"context": {
"path": "{json_pointer_to_patch_operation}",
"actual_value": "actual value"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in an invalid Statement

Media type

application/json
Examples

patch-result-missing-field
Example Value
Schema
{
"code": "patch-result-missing-field",
"message": "Required field missing in patch result",
"context": {
"path": "{json_pointer_to_parent}",
"field": "{missing_field}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

DELETE
/entities/properties/{property_id}/statements/{statement_id}
Delete a single Statement from a Property

This endpoint is also accessible through /statements/{statement_id}.

Parameters
Try it out
Name Description
property_id \*
string
(path)
The ID of the required Property

Example : P694

P694
statement_id \*
string
(path)
The ID of a Statement on a Property

Example : P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71

P694$B4C349A2-C504-4FC5-B7D5-8B781C719D71
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json
Edit payload containing edit metadata

Example Value
Schema
{
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
The requested Statement was deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
"Statement deleted"
Headers:
Name Description Type
Content-Language
Language code of the language in which response is provided

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

GET
/statements/{statement_id}
Retrieve a single Statement

This endpoint is also accessible through /entities/items/{item_id}/statements/{statement_id} and /entities/properties/{property_id}/statements/{statement_id}

Parameters
Try it out
Name Description
statement_id \*
string
(path)
The ID of a Statement

Example : Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA

Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Modified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Authorization
string
(header)
Make authenticated request using a provided bearer token

Example : Bearer mF_9.B5f-4.1JqM

Bearer mF_9.B5f-4.1JqM
Responses
Code Description Links
200
The requested Statement. Please note that the value of the ETag header field refers to the subject's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
304
The specified resource has not been modified since last provided revision number or date

Headers:
Name Description Type
ETag
Last entity revision number

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PUT
/statements/{statement_id}
Replace a single Statement

This endpoint is also accessible through /entities/items/{item_id}/statements/{statement_id} and /entities/properties/{property_id}/statements/{statement_id}

Parameters
Try it out
Name Description
statement_id \*
string
(path)
The ID of a Statement

Example : Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA

Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json
Payload containing a Wikibase Statement object and edit metadata

Example Value
Schema
{
"statement": {
"property": {
"id": "P17"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"parts": [
{
"property": {
"id": "P709"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
},
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
A Wikibase Statement. Please note that the value of the ETag header field refers to the subject's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

PATCH
/statements/{statement_id}
Change elements of a single Statement

This endpoint is also accessible through /entities/items/{item_id}/statements/{statement_id} and /entities/properties/{property_id}/statements/{statement_id}

Parameters
Try it out
Name Description
statement_id \*
string
(path)
The ID of a Statement

Example : Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA

Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json-patch+json
Payload containing a JSON Patch document to be applied to the Statement and edit metadata

Example Value
Schema
{
"patch": [
{
"op": "add",
"path": "/references/-",
"value": {
"parts": [
{
"property": {
"id": "P709"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
}
],
"tags": [],
"bot": false,
"comment": "Add reference to Statement"
}
Responses
Code Description Links
200
A Wikibase Statement. Please note that the value of the ETag header field refers to the subject's revision ID.

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"id": "Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA",
"rank": "normal",
"property": {
"id": "P17",
"data_type": "string"
},
"value": {
"type": "value",
"content": "Senior Team Supervisor"
},
"qualifiers": [
{
"property": {
"id": "P706",
"data_type": "time"
},
"value": {
"type": "value",
"content": {
"time": "+2023-06-13T00:00:00Z",
"precision": 11,
"calendarmodel": "http://www.wikidata.org/entity/Q1985727"
}
}
}
],
"references": [
{
"hash": "7ccd777f870b71a4c5056c7fd2a83a22cc39be6d",
"parts": [
{
"property": {
"id": "P709",
"data_type": "url"
},
"value": {
"type": "value",
"content": "https://news.example.org"
}
}
]
}
]
}
Headers:
Name Description Type
ETag
Last entity revision number

string
Last-Modified
Last modified date

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The provided JSON Patch request is invalid

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
409
The provided JSON Patch cannot be applied

Media type

application/json
Examples

patch-test-failed
Example Value
Schema
{
"code": "patch-test-failed",
"message": "Test operation in the provided patch failed",
"context": {
"path": "{json_pointer_to_patch_operation}",
"actual_value": "actual value"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
422
Applying the provided JSON Patch results in an invalid Statement

Media type

application/json
Examples

patch-result-missing-field
Example Value
Schema
{
"code": "patch-result-missing-field",
"message": "Required field missing in patch result",
"context": {
"path": "{json_pointer_to_parent}",
"field": "{missing_field}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links

DELETE
/statements/{statement_id}
Delete a single Statement

This endpoint is also accessible through /entities/items/{item_id}/statements/{statement_id} and /entities/properties/{property_id}/statements/{statement_id}

Parameters
Try it out
Name Description
statement_id \*
string
(path)
The ID of a Statement

Example : Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA

Q24$9966A1CA-F3F5-4B1D-A534-7CD5953169DA
If-Match
array[string]
(header)
Conditionally perform the request only if the resource has not been modified since one of the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-None-Match
array[string]
(header)
Conditionally perform the request only if the resource has been modified since the specified entity revision numbers

Example : List [ ""1276705620"" ]

"1276705620"
If-Unmodified-Since
string($http-date)
(header)
Conditionally perform the request only if the resource has not been modified after the specified date

Example : Sat, 06 Jun 2020 16:38:47 GMT

Sat, 06 Jun 2020 16:38:47 GMT
Request body

application/json
Edit payload containing edit metadata

Example Value
Schema
{
"tags": [],
"bot": false,
"comment": "Example edit using the Wikibase REST API"
}
Responses
Code Description Links
200
The requested Statement was deleted

Media type

application/json
Controls Accept header.
Example Value
Schema
"Statement deleted"
Headers:
Name Description Type
Content-Language
Language code of the language in which response is provided

string
X-Authenticated-User
Optional username of the user making the request

string
No links
400
The request cannot be processed

Media type

application/json
Examples

invalid-path-parameter
Example Value
Schema
{
"code": "invalid-path-parameter",
"message": "Invalid path parameter: '{path_parameter}'",
"context": {
"parameter": "{path_parameter}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
403
The access to resource was denied

Media type

application/json
Examples

permission-denied
Example Value
Schema
{
"code": "permission-denied",
"message": "Access to resource is denied",
"context": {
"denial_reason": "{reason_code}",
"denial_context": "{additional_context}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
404
The specified resource was not found

Media type

application/json
Examples

resource-not-found
Example Value
Schema
{
"code": "resource-not-found",
"message": "The requested resource does not exist",
"context": {
"resource_type": "{resource_type}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
412
The condition defined by a conditional request header is not fulfilled

No links
429
Too many requests

Media type

application/json
Examples

request-limit-reached
Example Value
Schema
{
"code": "request-limit-reached",
"message": "Exceeded the limit of actions that can be performed in a given span of time",
"context": {
"reason": "{reason_code}"
}
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
500
An unexpected error has occurred

Media type

application/json
Example Value
Schema
{
"code": "unexpected-error",
"message": "Unexpected Error"
}
Headers:
Name Description Type
Content-Language
Language code of the language in which error message is provided

string
No links
OpenAPI document

GET
/openapi.json
Retrieve the OpenAPI document

Parameters
Try it out
No parameters

Responses
Code Description Links
200
OpenAPI document

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"openapi": "...",
"info": {
"title": "Wikibase REST API",
"version": "...",
"description": "OpenAPI definition of Wikibase REST API"
},
"paths": "..."
}
No links
Property data types

GET
/property-data-types
Retrieve the map of Property data types to value types

Parameters
Try it out
No parameters

Responses
Code Description Links
200
The map of Property data types to value types

Media type

application/json
Controls Accept header.
Example Value
Schema
{
"data-type": "value-type"
}
No links

Schemas
LabelsCollapse allobject
Additional propertiesstring
DescriptionsCollapse allobject
Additional propertiesstring
AliasesCollapse allobject
Additional propertiesExpand allarray<string>
SitelinkCollapse allobject
titlestring
badgesCollapse allarray<string>
Itemsstring
urlread-onlystring
ReferenceCollapse allobject
hashCollapse allread-onlystring
Hash of the Reference

partsCollapse allarray<object>
ItemsCollapse allobject
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
StatementCollapse allobject
idCollapse allread-onlystring
The globally unique identifier for this Statement

rankCollapse allstring
The rank of the Statement

Allowed values"deprecated""normal""preferred"
Default"normal"
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
qualifiersCollapse allarray<object>
ItemsCollapse allobject
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
Default[]
referencesCollapse allarray<object>
ItemsCollapse allobject
hashCollapse allread-onlystring
Hash of the Reference

partsCollapse allarray<object>
ItemsCollapse allobject
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
Default[]
ItemCollapse allobject
idread-onlystring
typeCollapse allread-onlystring
Const"item"
labelsCollapse allobject
Additional propertiesstring
descriptionsCollapse allobject
Additional propertiesstring
aliasesCollapse allobject
Additional propertiesCollapse allarray<string>
Itemsstring
sitelinksCollapse allobject
Additional propertiesCollapse allobject
titlestring
badgesCollapse allarray<string>
Itemsstring
urlread-onlystring
statementsCollapse allobject
Additional propertiesCollapse allarray<object>
ItemsCollapse allobject
idCollapse allread-onlystring
The globally unique identifier for this Statement

rankCollapse allstring
The rank of the Statement

Allowed values"deprecated""normal""preferred"
Default"normal"
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
qualifiersCollapse allarray<object>
ItemsCollapse allobject
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
Default[]
referencesCollapse allarray<object>
ItemsCollapse allobject
hashCollapse allread-onlystring
Hash of the Reference

partsCollapse allarray<object>
ItemsCollapse allobject
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
Default[]
PropertyCollapse allobject
idread-onlystring
typeCollapse allread-onlystring
Const"property"
data_typestring
labelsCollapse allobject
Additional propertiesstring
descriptionsCollapse allobject
Additional propertiesstring
aliasesCollapse allobject
Additional propertiesCollapse allarray<string>
Itemsstring
statementsCollapse allobject
Additional propertiesCollapse allarray<object>
ItemsCollapse allobject
idCollapse allread-onlystring
The globally unique identifier for this Statement

rankCollapse allstring
The rank of the Statement

Allowed values"deprecated""normal""preferred"
Default"normal"
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
qualifiersCollapse allarray<object>
ItemsCollapse allobject
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
Default[]
referencesCollapse allarray<object>
ItemsCollapse allobject
hashCollapse allread-onlystring
Hash of the Reference

partsCollapse allarray<object>
ItemsCollapse allobject
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentExpand allany
typeExpand allstring
Default[]
QualifierCollapse allobject
propertyCollapse allobject
idCollapse allstring
The ID of the Property

data_typeCollapse allread-onlystring | null
The data type of the Property

valueCollapse allobject
contentCollapse allany
The value, if type == "value", otherwise omitted

typeCollapse allstring
The value type

Allowed values"value""somevalue""novalue"
