# 0001: Custódia Documental Oficial em HTML com Hash SHA-256

* **Status:** Aceito
* **Data:** 2026-09-20
* **Contexto:** Inicialmente, a ingestão de dados técnicos de rações dependia de PDFs baixados de sites de fabricantes. No entanto, PDFs possuem layouts heterogêneos, quebras frequentes de links externos, formatos complexos para extração automatizada e risco de adulteração sem rastro verificável.
* **Decisão:** Extinguimos totalmente a dependência de arquivos PDF. Padronizamos a ingestão e custódia pericial de dados através do armazenamento do código HTML integral da página oficial do fabricante no momento da análise, indexado com hash criptográfico SHA-256 no banco de dados (`Product.sourceHtml` e `Product.sourceHtmlSha256`).
* **Consequências:** Garantia de certeza probatória inquestionável, proteção jurídica perante órgãos de defesa do consumidor (CDC) e fabricantes, e facilidade de confrontar se uma fórmula sofreu alteração com um simples `diff` de hashes.
