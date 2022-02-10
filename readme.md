## API - Crawler

- **Contexto**: recebido um pedido(teste) de construção de um crawler 
- **O que ele faz**: varre os dados do site do github em busca de páginas oficiais de tecnologias, passadas pelo corpo da requisição
- **Como ele salva os dados**: caso exista uma página oficial, salva os dados coletados em forma de JSON em um banco MongoDB(não relacional) e cria uma referência com alguns atributos para o JSON em um banco MySQL(relacional).
- **Rotas da API**: 
  - **GET**: retorna todas as buscas realizadas;
  - **GET**: recebe um id no parâmetro e retorna o elemento;
  - **POST**: recebe no corpo o que buscar e salva nos bancos de dados o resultado da varredura.
