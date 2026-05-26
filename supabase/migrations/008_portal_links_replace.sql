-- Substitui os links padrão pelos portais do corretor
TRUNCATE TABLE portal_links;

INSERT INTO portal_links (name, url, icon_label) VALUES
  ('Matriz Oferta - Tenda',    'https://simulador.tenda.com/?redirect=%2FMatrizOferta', 'MT'),
  ('Registrato BACEN',         'https://www.bcb.gov.br/meubc/registrato',               'BC'),
  ('Simulador Caixa',          'https://www.portaldeempreendimentos.caixa.gov.br/simulador/', 'CX'),
  ('Portal Corretores - Tenda','https://evs.tenda.com/Login',                           'PC'),
  ('Simulador Caixa WW8',      'https://www8.caixa.gov.br/siopiinternet-web/simulaOperacaoInternet.do?method=inicializarCasoUso', 'C8');
