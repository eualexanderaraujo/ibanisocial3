
import fs from 'fs';
import path from 'path';

// Manual loading of .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}
import { getSheets, getSpreadsheetId, getTimestampParts } from './lib/googleSheets';
import { v4 as uuidv4 } from 'uuid';
import { calculatePriority, getTipoCesta } from './lib/schema';
import { CadastroInput, CadastroRow } from './types/cadastro';

// Load raw data
const rawData = `12/02/2026 14:09:54			Jorge Jr 21 98511-3945	Janielle Souza 21 98615-5451	Emmanuel: Deus conosco	AZUL	Flor de Lotus 21 97358-6389	Não	Sim	2	1	Atualmente, ninguém 	2							
12/02/2026 16:56:52	luiswendling@gmail.com		Luis Wendling 21 96489-6337	Saulo 21 99671-5140	Zion	VERDE	Marluce Rodrigues 21 96489-7562	Sim	Sim	2	3	1	1							
13/02/2026 13:01:34	quintanilhamissao@gmail.com		ARINEA QUINTANILHA 	CARLOS - 979757079	AMOR E MILAGRES	VERDE	VANESSA E  FAMILIA -' 992295761	Sim	Sim	02 e 01 adolescente 	Nemhima	Nenhuma (devido a esposa desempregada e esposo problemas de saude)	02							
15/02/2026 10:35:38	ericamarias.rf@gmail.com		Alex 21994403599	Ronaldo +55 21 97632-9267	Porta aberta	VERMELHA	Adilson +55 21 99505‑6673	Sim	Sim	2 adultos 	Nao	Ninguém 	2							
12/02/2026 16:56:52	luiswendling@gmail.com		Luis Wendling 21 96489-6337	Saulo 21 99671-5140	Zion	VERDE	Marluce Rodrigues 21 96489-7562	Sim	Sim	2	3	1	1							
17/02/2026 12:20:03	dannyjni@gmail.com		Leonardo Lima de Oliveira  21980338899	Fabiano de Souza 21 98868-8630	Morada 	AZUL	Leonardo Alexandrino	Sim	Sim	2	1	1	1							
18/02/2026 14:13:13	prleonardo.ferreira@ibatitude.com.br		Miriam :: 98281-6716		conexão 	VERDE	Valdineia Barbosa da Silva	Não	Não	2	2	0	2							
18/02/2026 17:54:15	marafaber1962@gmail.com		Mara Lucia de Castro Faber dos Santos @	@Miriam Ferreira (21)98201-6716 /Pr.Milton	Esperança	VERMELHA	Eliane Moreira 	Não	Sim	1	1	Desempregada	1							
19/02/2026 13:18:32	romildo46dias@gmail.com		Romildo 	Romildo	Vivendo milagres	VERDE	Eni Vinilce	Sim	Sim	2	Nenhuma	Uma aposentada	1 pessoa							
19/02/2026 13:20:14	romildo46dias@gmail.com		Romildo	Romildo	Vivendo milagres	VERDE	Pratricia Bruno	Não	Sim	2	2	Nenhuma	Um e um esta preso							
22/02/2026 18:48:52	gabryelle.silva5@gmail.com		Ana Beatriz Trigo +55 21 96998-3311	Vanessa +55 21 98906-8327	Lugares Altos 	BRANCA	Gabryelle 21980806793	Sim	Sim	1	Sim	1	1							
23/02/2026 10:08:32	diasjosyanne@gmail.com		Marcelo Ramos de Santana (21) 988670309	Luciano Oliveira (21) 97209-8953	Conectados com Deus 	BRANCA	Tatiane Alves +55 21 99254-3008	Sim	Sim	1	0	0	1 - Está com o auxílio suspenso 							
23/02/2026 16:46:35	tina.studiohair@gmail.com		Claudia Lourenço 21993640431	Viviane Amorim 21964335354	influenciadores do Amor 	VERMELHA	Danielle Corriça	Sim	Sim	2 (1 adulto e 1 adolescente) 	0	Ninguém 	2							
24/02/2026 18:19:01	nathaliaviegasbelieber@gmail.com		Mariah +55 21 99056-1537	Luana Campos +55 21 98156-5414	Life Saver	ROXA	Nelcy +55 98 98198-5808	Não	Não	2	1	Nenhuma 	2							
25/02/2026 12:33:34	angelorcf1980@gmail.com		Ângelo Romualdo 21985425637	Fabiano	Tempo de recomeçar 	AZUL	Ângelo Romualdo da Costa Filho 	Sim	Sim	2	1	Vivemos de bico 	2							
25/02/2026 12:43:31	leandrosantos.lima1084@gmail.com		Leandro Lima - 21 966213544	Pr. Fabiano Souza - 21 98868-8630	GE Recomeços	AZUL	Guilherme Emiliano Quaresma 	Não	Sim	Dois adultos e duas crianças 	Duas 	Uma pessoa	Uma pessoa 							
26/02/2026 15:27:06	dannyjni@gmail.com		Leonardo Lima de Oliveira 21980338899	Fabiano Souza  21 98868-8630	Morada	AZUL	Jairo Barbosa  21 97468-7978	Não	Sim	2	0	0	2							
28/02/2026 14:29:02	nathiesamirr@gmail.com		Nathalia Nascimento 21974493493	Nathalia Nascimento 21974493493	Resplandecer 	VERMELHA	Salomão 21970246092	Não	Sim	2	3	0	2							
28/02/2026 17:09:25	shirleycoa@gmail.com		Marcus José 21976582421	Saulo 21 98272-7064	Elyon 	VERDE	Tereza Cristina Alves Ferreira Moraes 21 98070-8245	Sim	Sim	3	0	1	2							
01/03/2026 11:20:27	natassiabrasileiro@gmail.com		Natassia 21981447100	Natassia 	Lar de Milagres 	LARANJA	Keit Darley 	Sim	Sim	2	2	Nenhuma 	2 adultos 							
01/03/2026 11:53:38	adilsonpkinha@gmail.com	Adilson	Diogo 2199328-0496		Chamados para restaurar 	AZUL	Maria Soares	Não	Não	Somente ela	0	Ninguém, ela recebe aposentadoria salário mínimo 	Nenhum							
01/03/2026 13:45:17	palomaadv11@gmail.com		Paloma 21 98825-5795 	Samuel 21 99917-1524	Transformação e vida 	VERMELHA	Cristina da Silva Lima Carvalho 21 99460-3951	Sim	Sim	2	1	1	1							
01/03/2026 13:48:45	palomaadv11@gmail.com		Paloma 21 98825-5795 	Samuel  21 99917-1524	Transformação e vida 	VERMELHA	Priscilla Vitorino Pereira 21 98667-7612	Sim	Sim	2	2	1	0							
02/03/2026 09:14:07	edmarpeluchi@gmail.com		Edmar Peluchi 21965422426	Leonardo 2198033-2226	Rio de Vida 	AZUL	Rosa Maria de Souza Costa Ribeiro 	Sim	Sim	4	0	1	3							
02/03/2026 15:42:33	debimavi@gmail.com		Natassia	Daniele	Lar de milagres	LARANJA	Sandra 21982994797	Não	Não	3	2	1	2							
02/03/2026 16:46:15	carolrailson2@gmail.com		Natassia	Daniele	Lar de milagres	LARANJA	Caroline Cristina Santos lopes	Não	Não	5	0	1	2							
03/03/2026 07:46:07	ricardosantanajs105@gmail.com		Adriano Basílio 	Adriano 	Ágape 	AMARELA	José Ricardo dos Santos Santana 	Sim	Sim	1	1	Afastado 	01							
03/03/2026 12:24:15	adrinegao1603@gmail.com		Adriano Basílio 	Adriano Basílio 	Agape	AMARELA	Julio Cezar da Silva Nascimento 	Sim	Sim	1	1	Só ele e no Momento desempregado 	Um o filho e Estudante 							
04/03/2026 10:30:29	maiconmichel648@gmail.com		Michel ,+55 21997868813	Nathalia +55 21 97449-3493	Mensageiros 	VERMELHA	Joana darc  +55 21991394972	Não	Sim	2	1	0	2							
04/03/2026 10:34:00	maiconmichel648@gmail.com		Michel +5521997868813	Nathalia +55 21 97449-3493	Mensageiros 	VERMELHA	Aparecido Vicente  21993169343	Sim	Sim	2	1	0	2							
04/03/2026 10:36:56	maiconmichel648@gmail.com		Michel +5521997868813	Nathalia +55 21 97449-3493	Mensageiros 	VERMELHA	Kauane Sampaio  +5521974691818	Sim	Sim	2	2	0	2							
04/03/2026 15:41:55	andresindeclubes@gmail.com		Guatavo Angelo	André Toledo 	Revival Flame	AMARELA	Gustavo 21969681443	Sim	Sim	2	2	0	2							
04/03/2026 21:10:29	alinebarbosa7272@gmail.com		Aline/21993576516	Wellignton/21 99727-1918	Paz e Recomeços 	VERMELHA	Carmen Lúcia da Silva Cruz 	Não	Sim	1	0	0	0							
05/03/2026 07:26:52	camilla.rafffaely@gmail.com		Camilla Raffaely 21991112626	Luciano Oliveira 21 972098953	Floresça 	BRANCA	Monique Simor 21 994629719	Não	Sim	1	2	0	1							
06/04/2026 14:48:06	luiswendling@gmail.com		Luis 21 96489-6337	Saulo	Zion	VERDE	Marluce Rodrigues	Sim	Sim	2	3	1	1							
06/03/2026 17:31:00	alessandra10.martins@gmail.com		Alessandra Martins 21 964517098	Denize Costa 	Vida em vidas 	VERMELHA	Magda Borges 	Sim	Sim	3	0	0	1							
07/03/2026 10:17:05	nathiesamirr@gmail.com		Nathalia Nascimento 	Nathalia Nascimento 	Resplandecer 	VERMELHA	Adriana 21 99344-9138	Não	Sim	2	2	0	2							
11/03/2026 13:10:35	ggpereira83@gmail.com		Leandro de Freitas Silva Pereira 	Samuel 	Reativando Sonhos 	VERMELHA	Samuel (21) 99917-1524	Não	Não	2	0	Estão desempregados 	2							
11/03/2026 13:14:26	ggpereira83@gmail.com		Leandro de Freitas Silva Pereira 	Samuel (21) 9917-1524	Reativando Sonhos 	VERMELHA	Liliane Coelho (21) 99274-0479	Sim	Sim	3	0	1 recebe aposentadoria 	3							
12/03/2026 11:31:16	nadiacerejoo@gmail.com		Valdir de Oliveira Cerejo 21986860345	Pr Anderson Silva 21970772787	Alfha e Ômega 	AZUL	Beatriz da Silva Braga  21 966989931	Sim	Sim	1	2	0	1							
13/03/2026 12:26:51	janielle.nunes.souza@gmail.com		Janielle	Fabiano	A casa é  sua	AZUL	Isa 968399282	Não	Sim	2	2	1	1							
14/03/2026 22:55:54	saulobrjuridico@gmail.com		Carlos Alberto Oliveira Mendes - 21 96580-0513	Saulo Brasileiro - 21 98323-9609	Célula Talmidim 	LARANJA	Nelson Cordeiro Alves 	Não	Sim	Morando sozinho 	Não 	Só só 	Ele esta desempregado 							
15/03/2026 10:49:12	glopesdealmeida28@gmail.com		Miriam Ferreira	Miriam Ferreira	Conexão	VERDE	Gabriel Lopes de Almeida 21 98014-3132 	Sim	Sim	2	1	1	2							
16/03/2026 19:41:16	marafaber1962@gmail.com		Mara Lucia de Castro Faber dos Santos(21) 976734522	Miriam Ferreira 	Esperança	VERMELHA	Eliane Moreira 	Não	Sim	01	01	Atualmente desempregada	01							
17/03/2026 11:31:36	alessandra10.martins@gmail.com		Alessandra 21 964517088	Denize Costa 	Vida em Vidas 	VERMELHA	Jaqueline Bravo 2199300-0899	Sim	Sim	1	1	0	1							
17/03/2026 13:47:49	lbarbosamonteirodias@gmail.com	Lucimar	Lilian ( 21987211488)	Lilian ( 21987211488)	Celeiro de benção 	LARANJA	Lucimar ( 21 99533-9985)	Não	Sim	2	2	1	1							
17/03/2026 13:49:22	lbarbosamonteirodias@gmail.com	Lucimar	Lilian ( 21987211488)	Lilian ( 21987211488)	Celeiro de benção 	LARANJA	Fabiane ( 21 99746-7097)	Não	Sim	2	1	1	1							
17/03/2026 13:51:00	lbarbosamonteirodias@gmail.com	Lucimar	Lilian (21987211488)	Lilian (21987211488)	Celeiro de bençãos 	LARANJA	Alexandra (21 98196-0552)	Não	Sim	1	1	0	1							
17/03/2026 13:52:00	lbarbosamonteirodias@gmail.com	Lucimar	Lilian (21987211488)	Lilian (21987211488)	Celeiro de bençãos 	LARANJA	Alexandra (21 98196-0552)	Não	Sim	1	1	0	1							
17/03/2026 17:46:38	rubia.netnote@gmail.com	Gisele	Rúbia Olive 98233-5802	Rebeca Levate 21 96531-0707	Fruto do Espírito 	VERDE	Giselly Coelho 	Sim	Sim	2	0	0	2							
18/03/2026 08:39:32	tina.studiohair@gmail.com		Claudia Lourenço 21993640431	Viviane Amorim  21 96433-5354	Influenciadores do Amor 	VERMELHA	Danielle CORRIÇA 21 99195-0304	Sim	Sim	1 adulto e 1 adolescente  	0	0	2							
18/03/2026 11:23:48	vaniavovo78@gmail.com		ARETHA 	Rafael	Transborde 	AMARELA	Vânia Lúcia    / 92022 6837	Sim	Sim	1 pessoa 	Não  tem	1	1							
19/03/2026 16:04:33	adrinegao1603@gmail.com		Adriano Basilio	Adriano Basilio	Agape	AMARELA	Maurício Romero 21 996591884	Sim	Sim	1	1 Criança	Ele está desempregado 	Só ele 							
19/03/2026 16:14:56	edinhonsoares@gmail.com		Edson 21 99031-5422 	Cadu 2199081-5584	Dorcas 	ROXA	Carlos 2198082-7087	Não	Sim	1	1 Criança	Ninguém 	1							
19/03/2026 16:30:07	ad95129178@gmail.com		Thiago  F. Portela - (21) 98233-5099	Thiago F. Portela - (21) 98233-5099	Coração do pai 	LARANJA	Altamiro Lermos. (21) 96836-9882	Sim	Sim	Uma , não tem criança. 	1 Criança	 Uma, não é carteira assinada .	Uma 							
19/03/2026 19:08:35	quintanilhamissao@gmail.com		 Pr Edson Quintanilha Barbosa / 21 98852-3480	Carlos / 21 97975-7079	Amor & Milagres	VERDE	Aline Storte/ 21 97171-9760	Sim	Sim	1 adulto	1 Criança, Acima de 4 Crianças	Nenhuma	1							
19/03/2026 19:12:28	quintanilhamissao@gmail.com		Pr Edson Quintanilha / 21 97655-3480	Carlos / 21 97975-7079	Amor & Milagres	VERDE	Maurício  / 21 97680-4197	Sim	Não	1	Acima de 4 Crianças	Nenhuma 	1							
19/03/2026 19:16:29	quintanilhamissao@gmail.com		Pr Edson Quintanilha  / 21 98852-3480	Carlos / 97975-7079	Amor & Milagres	VERDE	Mário Rodrigues 	Não	Não	1	1 Criança	-	Trabalha de biscate							
20/03/2026 08:33:24	ketelenroze.azeredo@gmail.com	Ketelenroze	Ketelenroze Souza de azeredo da silva	Lilian dias +55 21 98721-1488	Ramos da videira	LARANJA	Raquel Vianna +55 21 99255-4061	Não	Sim	2	1 Criança	Nenhuma . Mãe não trabalha e benefício foi suspenso. Filha 16 anos retardo mental autismo 	1							
20/03/2026 18:00:21	miriamgoncalves68@gmail.com	Miriam	Míriam Gonçalves de Lima 	Milton Barros 	Conexão 	VERMELHA	Michelle Moretti 	Sim	Sim	3	1 Criança	Nenhuma, duas filhas uma jovem e outra adolescente 	2							
21/03/2026 07:42:18	ericamarias.rf@gmail.com		Alex da Silva Ribeiro 21994403599	21976329267	Porta aberta	VERMELHA	Adilson	Sim	Sim	4	2 Crianças	1	3							
22/03/2026 18:13:34	lace2023claudia1971@gmail.com		Thiago	Thiago	Coração do pai 	LARANJA	Altamiro 	Sim	Sim	Um	1 Criança	Ele é biscate 	Um							
22/03/2026 19:39:45	dannyjni@gmail.com	Valeria	Leonardo Oliveira (21)980332226	Fabiano (21) 98868-8630	Morada	AZUL	Jairo Barbosa (21) 97468-7978	Não	Sim	2	1 Criança	0	0							
24/03/2026 12:54:05	dmartinssanches@gmail.com		Diogo Martins Sanches 2198046-9929 	Welton Santana 2199754-6483	O Novo de Deus 	VERDE	Fernando Henrique Gama Miranda da Silva	Sim	Sim	2	Sem Crianças	2	0							
25/03/2026 09:41:38	diegofonsecaav@gmail.com		Diego Fonseca - 21959327935	Vitor Jorge - 2199227-8969	Nova Aliança	AZUL	Jansen - 2197701-3700	Sim	Sim	1	1 Criança	1	0							
25/03/2026 20:11:15	diogo.ae13@gmail.com	Diogo Teixeira	Diogo Teixeira 21 965109833	Marcos Vinicius 21 96807-9201	Amor Incondicional 	AMARELA	Micheli da Silva de Barros (21)974510218	Não	Não	3	2 Crianças	2 salários mínimos 	1							
26/03/2026 09:31:41	prleonardo.ferreira@ibatitude.com.br	Matheus	Miriam :: 21 98201-6716	pr Leo :: 21 98201-6720	Conexão	VERDE	Mateus e Agnes	Não	Não	3	2 Crianças	O Mateus vende bala no sinal próximo à igreja	3							
26/03/2026 09:36:40	prleonardo.ferreira@ibatitude.com.br	Daniel	Miriam :: 21 98201-6716	pr Leo :: 98201-6720	Conexão	VERMELHA	Valdineia Barbosa da Silva	Não	Não	2	2 Crianças	0	2							
28/03/2026 08:37:30	r0bs0ncarl0sfigueired0@gmail.com	Washington	Robson Carlos Figueiredo (21) 99695-6607 	Pastor Léo (21) 98201-6720	Aliança	VERMELHA	Washington Francisco Pereira (21) 97070-8155	Não	Não	1	Sem Crianças	Nenhuma	1							
28/03/2026 13:45:59	laisa.chagass@gmail.com	Vivian	Laísa 21 988902198	welton Santana 21 997546483	Recomeço 	VERDE	wanderson de lima	Não	Não	1	Acima de 3 Crianças	Nenhuma 	1							
29/03/2026 08:47:49	edmarpeluchi@gmail.com		Edmar Peluchi 21965422426	Leonardo (21) 98033-2226	Rio de Vida 	AZUL	Rosa Maria de Souza Costa Ribeiro (21) 98519-4991	Sim	Sim	3	Sem Crianças	1	2							
30/03/2026 13:48:05	info.especialista@gmail.com	Elisangela	Camilla (21-99111-2626)	Luciano (21-972098953)	Floresça	BRANCA	Elizangela Monteiro (21-97510-8571)	Sim	Sim	3	Sem Crianças	0	4							
30/03/2026 22:10:10	leilane.alves.almeida@gmail.com		Cristiano - (21) 97487-7979		Revived in Christ 	LARANJA	Débora Raquel Barbosa Carlos	Sim	Sim	1	1 Criança	0	1							
01/04/2026 10:49:55	edinhonsoares@gmail.com	Edson	Edson Neves 21 99031-5422 	Cadu 21 99081-5584	Dorcas	ROXA	Isabela 	Não	Não	Dois	2 Crianças	Ninguém 	Dois							
01/04/2026 12:05:51	eduardolugon@gmail.com	Eduardo	Eduardo Andrade (21) 99257-9771	Alexandre (21) 97695-6017	Conexão Ágape	AMARELA	Josefa Rosa	Não	Não	3	2 Crianças	1	1							
01/04/2026 20:57:20	diegofonsecaav@gmail.com		Diego Fonseca 	Vitor - 2199227-8969	Nova aliança 	AZUL	Jansen  2197701-3700	Sim	Sim	1	1 Criança	1	0							
02/04/2026 10:46:34	rodrigolaeber80@gmail.com	Rodrigo	Rodrigo Laeber (21) 98387-8282	Pra. Dani	Solo Fértil 	LARANJA	Jesiel Torres 	Sim	Sim	4	1 Criança	1	1							
02/04/2026 11:03:08	mihbezerra@gmail.com	Raphael	Michelle Bezerra 	Raphael 	Verdadeiro amor 	AMARELA	Carlos Alberto  976564556	Não	Não	2	1 Criança	Os dois desempregados 	Os dois 							
02/04/2026 18:22:57	angelorcf1980@gmail.com	Angelo	Ângelo 	Fabiano	Tempo de recomeçar 	AZUL	Ângelo romualdo 	Sim	Sim	2	1 Criança	0	2							
03/04/2026 09:38:44	samuelpessoa45@gmail.com	Pr. Jonatas	Samuel da Silva Pessôa 	Samuel da Silva Pessôa 	Vida Plena	VERMELHA	Marco Aurélio 21-99719-0318	Sim	Sim	2	2 Crianças	Nenhuma	1							
05/04/2026 09:34:20	gustavonteixeira@gmail.com	Gustavo	Gustavo do nascimento teixeira, 2197481-2212	Saulo, 21 98272-7064	Estela de Davi 	VERDE	Maristela, 21 9 9302-5040	Não	Sim	1	1 Criança	1 pessoas porém sem pagamento há três meses 	0 mas sem pagamento á três meses 							
06/04/2026 13:17:27	jessica.mariahdsp@gmail.com	Natalia	Jessica Maria (21) 99056-1537	Luana Campos (21) 98156-5414	Life Saver	ROXA	Robson (21) 98133-4353	Não	Não	2	Sem Crianças	Atualmente nenhuma 	Todos							
06/04/2026 16:57:33	elisadavi82@gmail.com		Elisabete Figueiredo Davi	Leandro / 21 99530-1282	Deus cuida de mim	LARANJA	Elenilda souza castro/  21 97016-1849	Não	Não	1	Sem Crianças	Nenhuma	1							
06/04/2026 18:42:56	th.britto87@gmail.com	Thiago	Thiago  96418-8763 	Saulo Moura 996715140	ASAFE 	VERDE	Diogo dos Santos Leite 	Não	Sim	2	Sem Crianças	Desempregado , aguardando cirurgia nos olhos 	2							
06/04/2026 19:17:29	lbarbosamonteirodias@gmail.com	Felipe	Lilian 21987211488	Lilian 21987211488	Celeiro de benção 	LARANJA	Carlos Alberto Oliveira da Silva	Sim	Sim	1	Sem Crianças	0	1							
07/04/2026 12:35:28	mag.andradeborges@gmail.com	Magda	Alessandra Martins e Renato (21 96451-7088)	Denize Costa (21 96536-3494)	Vida em vidas 	VERMELHA	Magda Borges (21 98633-9122)	Sim	Sim	4	1 Criança	1 pessoa 	3 pessoas 							
08/04/2026 08:49:06	mirianramalheda50@gmail.com	Luciete	Mirian Laeber (21 98349-8038)	Vinicius e Laís (21 96410-7265) (21 96415-2183)	Solo Fértil 	LARANJA	Luciene (21 99323-7213)	Sim	Sim	3	Sem Crianças	1	1. A Luciete mora com a mãe idosa e que precisa de cuidados diários.							
08/04/2026 09:19:28	iaradecassiapimentel@gmail.com	Areta	Areta (21) 97035-2417	Jôse	Transborde	AMARELA	Kelly Regina	Não	Não	1	1 Criança	Agora nenhuma 	Ela ,e o pai da criança q ,tá fugido!							
08/04/2026 16:04:43	prjonatassoares@ibatitude.com.br	Pr. Jonatas Soares	Ronaldo Mamede 	Pr Jonatas Soares 	Arca da aliança 	VERMELHA	Alex Costa - 81 99243-4080	Sim	Sim	1	Sem Crianças	Começou o trabalho agora 	0							
08/04/2026 18:20:15	keka.caldas18@gmail.com	Erika	Alexander 21 99427-9930 	Saulo e patricia 	Esperanca 	VERDE	Paula Duarte 	Sim	Sim	2	1 Criança	Nenhuma 	2							
10/04/2026 13:12:12	luiswendling@gmail.com	Luis	Luis 21964896337	Saulo e Patricia	Zion	VERDE	Marluce 21964897562	Sim	Sim	2	2 Crianças	1	1							
10/04/2026 17:05:03	fabricia.bricia.fg@gmail.com	Fabricia	Fabricia Gonçalves 21996767864	Fabricia Gonçalves 21996767864	Deus do impossível 	LARANJA	Flávia Pereira da Silva Vicente	Não	Sim	3	2 Crianças	Uma só, com vendas no momento 	2							
11/04/2026 09:57:47	dannyjni@gmail.com	Leonardo	Leonardo Oliveira 21980332226	Fabiano Souza 21988688630	Morada	AZUL	Leonardo Alexandrino 21975220643	Sim	Sim	2	2 Crianças	1	1							
11/04/2026 10:19:42	maiconmichel648@gmail.com	Nathalia	Michel +5521997868813	Nathalia +5521974493493	Mensageiros 	VERMELHA	Aparecido Vicente +5521993169343	Sim	Sim	2	1 Criança	0	2							
11/04/2026 10:31:26	maiconmichel648@gmail.com	Nathalia	Michel +5521997868813	Nathalia +5521974493493	Mensageiros 	VERMELHA	Kauane Sampaio +5521974691818	Sim	Sim	2	2 Crianças	0	2							
11/04/2026 10:36:47	maiconmichel648@gmail.com	Nathalia	Michel +5521997868813	Nathalia +5521974493493	Mensageiros 	VERMELHA	Joana darc +5521991394972	Não	Sim	2	1 Criança	0	2							
11/04/2026 16:51:13	alexsandroslima@gmail.com	Alex	Alex sandro da silva lima	Romildo dias +55 21 96767-5478	Frutificando em cristo 	VERDE	Silvana brito das merces e silva lima	Sim	Sim	3	1 Criança	1 aposentado 	1 pessoa desempregada 							
12/04/2026 08:53:33	diasjosyanne@gmail.com	Lariel	Marcelo Santana 21 988773453	Luciano oliveira +55 21 97209-8953	Conectados com Deus 	BRANCA	Larice Mathias +55 21 96991-0490	Não	Não	1	Acima de 3 Crianças	1	0							
12/04/2026 10:46:53	albertooliveiramendescarlos@gmail.com	Carlos Alberto	Carlos Alberto Oliveira Mendes/2196580-0513	Saulo/2198323-9609	Célula Talmidim	LARANJA	Nelselino Cordeiro Alves/2199407-6416	Não	Não	1	Sem Crianças	1	1							
12/04/2026 22:37:29	r.correianeto@gmail.com	Renato Alves	Alexandre 21 99327-3288	 Samuel 21 99917-1524	Rio da Vida	VERMELHA	Raquel Mattos Quintanilha 21965316724	Não	Não	1	2 Crianças	Ninguém 	1							
14/04/2026 10:11:59	ketelenroze.azeredo@gmail.com	Ketelenroze	Ketelenroze Souza de azeredo da silva	21 991473948	Lilian dias	+55 21 98721-1488	Ramos da videira	LARANJA	GladysLene		1	1	1	Igreja: Sim | Célula: Sim | Desempregados: Uma	Kids
14/04/2026 15:01:33	isabelacoliveira28@gmail.com	Flor de Lotus	Jorge Alves Menezes Junior	21 98511-3945	Janielle Souza	21 98615-5451	Emmanuel: Deus conosco	AZUL	Flor de Lotus		2	1	0	Igreja: Não | Célula: Sim | Desempregados: 2	Kids
15/04/2026 06:56:39	tarcilacristina61@gmail.com	Tarcila	Danúbia	21 99539-9588	Shirley 	21 98221-8175	VERDE	Tarcila 		4	1	1	Igreja: Sim | Célula: Sim | Desempregados: Todos	Kids
16/04/2026 23:59:52	lucelia.dinoguimaraes2@gmail.com		Rafael Dino 	21 991904173	VINICIUS		Ide	LARANJA	Thaís 	21 981384891	1	0	1	Igreja: Não | Célula: Não | Desempregados: 1	Adulto
17/04/2026 11:01:11	nathiesamirr@gmail.com	Nathali 	Nathalia Nascimento 	Resplandecer 	Nathalia Nascimento 21974493493	Resplandecer 	VERMELHA	Salomão 	+55 21 97061-5042	2	2	0	Igreja: Não | Célula: Sim | Desempregados: 2	Kids
17/04/2026 11:02:49	nathiesamirr@gmail.com	Nathali 	Nathalia Nascimento 	21974493493	Nathalia Nascimento 	Resplandecer 	VERMELHA	Adriana 	+55 21 99344-9138	2	2	0	Igreja: Não | Célula: Sim | Desempregados: 2	Kids
17/04/2026 19:30:37	thaismaiamiranda11@gmail.com	Caroline Menzes	Cristiano Gomes 	21974877979	Natasia 	Reviver in christ	LARANJA	Caroline Menezes 		2	0	1	Igreja: Sim | Célula: Sim | Desempregados: 2	Adulto
17/04/2026 20:02:16	fabiogds@yahoo.com.br	Liliane	Fábio Gonçalves da Silva 	(21)979752366	(21) 965363494	Casa de Paz	VERMELHA	Liliane dos Santos Coelho 		3	0	1	Igreja: Sim | Célula: Sim | Desempregados: 02	Adulto
17/04/2026 22:47:46	shirleycoa@gmail.com		Marcus José Santos de Carvalho 	21976582421	Saulo +55 21 98272-7064	Elyon 	VERDE	Tereza Cristina Alves Ferreira Moraes 		2	0	2	Igreja: Sim | Célula: Sim	Adulto
19/04/2026 11:15:41	saulobrjuridico@gmail.com	Sandra	Saulo Brasileiro 	Lar de Milagres 	Weriton 21964589734	Nova Identidade 	LARANJA	Sandra 	2197881-1080	2	0	0	Igreja: Não | Célula: Não | Desempregados: Todos	Adulto
19/04/2026 14:52:50	samuelpessoa45@gmail.com	Pr. Jonatas	Samuel Pessôa 	21-99917-1524	Samuel Pessôa 	Vida Plena	VERMELHA	Jacira Gomes - 21-99055-7154		2	1	1	Igreja: Sim | Célula: Sim | Desempregados: 1	Kids
19/04/2026 20:19:36	mariviny3@gmail.com		Cristiano 	 21 97487-7979	Natassia 	 21 98144-7100	LARANJA	Mariana 	21998401837	3	1	1	Igreja: Sim | Célula: Sim | Desempregados: 3	Kids
22/04/2026 00:10:41	tina.studiohair@gmail.com		Claudia Lourenço	21993640431	Viviane Amorim	Influenciadores do Amor 	VERMELHA	Danielle CORRIÇA 		1	0	1	Igreja: Sim | Célula: Sim | Desempregados: 2	Adulto
22/04/2026 20:07:02	angelorcf1980@gmail.com		Ângelo romualdo 	21985425637	Fabiano 	Tempo de recomecar 	AZUL	Angelo romualdo 		2	1	0	Igreja: Sim | Célula: Sim | Desempregados: 2	Kids
23/04/2026 22:48:51	edmarpeluchi@gmail.com		Edmar Peluchi 	21965422426	Leonardo 	Rio de Vida	AZUL	Miriam		2	0	0	Igreja: Sim | Célula: Sim | Desempregados: Todos	Adulto
24/04/2026 11:15:25	maurillia23@gmail.com		X	X	X	VERDE	X		3	0	1	Igreja: Sim | Célula: Sim | Desempregados: 1	Adulto
24/04/2026 21:46:17	diogo.ae13@gmail.com		Diogo Teixeira 	21965109833	Marcos Vinicius Ribeiro 	 2196807-9201	AMARELA	Micheli da Silva de Barros 	21974510218	3	2	1	Igreja: Não | Célula: Não | Desempregados: 1	Kids
26/04/2026 15:28:04	ggpereira83@gmail.com		Leandro de Freitas Silva Pereira 	21980520846	Samuel   (21) 9 9729-7219	Reativando Sonhos 	VERMELHA	Valdecira 		1	0	1	Igreja: Não | Célula: Não | Desempregados: 1	Adulto
`;

function cleanNumber(val: string) {
  if (!val) return 0;
  const textMap: Record<string, number> = { 'zero': 0, 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'quatro': 4, 'cinco': 5 };
  const normalized = val.toLowerCase().trim();
  for (const [text, num] of Object.entries(textMap)) {
    if (normalized.includes(text)) return num;
  }
  const match = val.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function parsePhone(val: string) {
  if (!val) return '';
  const match = val.match(/(?:\+55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]*\d{4}/);
  return match ? match[0].trim() : '';
}

function parseName(val: string) {
  if (!val) return '';
  return val.replace(/(?:\+55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]*\d{4}/, '').replace(/[@::]|[-\s]*\d{8,11}/g, '').trim();
}

async function runImport() {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  
  // Get max cesta number from SAIDAS
  const responseSaidas = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'SAIDAS!B:B',
  });
  const saidasValues = responseSaidas.data.values || [];
  let maxCesta = 0;
  saidasValues.slice(1).forEach(row => {
    const n = parseInt(row[0]);
    if (n > maxCesta) maxCesta = n;
  });

  const lines = rawData.trim().split('\n');
  const pedidosRows: any[][] = [];
  const saidasRows: any[][] = [];
  
  let currentCesta = maxCesta + 1;

  for (const line of lines) {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length < 8) continue;

    const dataOriginal = parts[0] || '';
    const email = parts[1] || '';
    const liderRaw = parts[3] || '';
    const supervisorRaw = parts[4] || '';
    const celula = parts[5] || '';
    const rede = parts[6] || '';
    const beneficiadoRaw = parts[7] || '';
    const membroIgreja = parts[8] || '';
    const membroCelula = parts[9] || '';
    const adultosRaw = parts[10] || '';
    const criancasRaw = parts[11] || '';
    const trabalhamRaw = parts[12] || '';
    const desempregadosRaw = parts[13] || '';
    const telefoneLiderExtra = parts[14] || '';

    const id_pedido = uuidv4().slice(0, 8).toUpperCase();
    const lider = parseName(liderRaw);
    const telefone_lider = parsePhone(liderRaw) || parsePhone(telefoneLiderExtra);
    const supervisor = parseName(supervisorRaw);
    const telefone_supervisor = parsePhone(supervisorRaw);
    const beneficiado = parseName(beneficiadoRaw);
    const telefone = parsePhone(beneficiadoRaw);
    const adultos = cleanNumber(adultosRaw);
    const criancas = cleanNumber(criancasRaw);
    const trabalham = cleanNumber(trabalhamRaw);
    const tipo_cesta = criancas > 0 ? 'Kids' : 'Adulto';

    const obs = [
      membroIgreja ? `Igreja: ${membroIgreja}` : '',
      membroCelula ? `Célula: ${membroCelula}` : '',
      desempregadosRaw && desempregadosRaw !== '0' ? `Desempregados: ${desempregadosRaw}` : ''
    ].filter(Boolean).join(' | ');

    const timestamp = getTimestampParts();

    // Mapping for 'pedidos'
    pedidosRows.push([
      id_pedido,
      dataOriginal, // data
      email,
      rede,
      celula,
      lider,
      telefone_lider,
      supervisor,
      telefone_supervisor,
      beneficiado,
      telefone,
      adultos + criancas, // total_pessoas
      adultos,
      criancas,
      0, // adolescentes
      0, // idosos
      trabalham,
      '', // tipo_renda
      '', // faixa_renda
      '', // problemas (vazio serializado)
      obs, // observacao
      0, // prioridade_score
      'Baixa', // prioridade_label
      '', // prioridade_motivos
      'entregue', // status (lowercase as per types)
      'Importação histórica', // observacoes_internas
      timestamp.display,
      timestamp.iso,
      id_pedido, // protocolo
      tipo_cesta
    ]);

    // Mapping for 'SAIDAS'
    saidasRows.push([
      uuidv4().slice(0, 8).toUpperCase(), // id
      currentCesta++, // cesta_basica
      celula,
      lider,
      beneficiado,
      tipo_cesta === 'Kids' ? 'KIDS' : 'ADULTO',
      'Sistema (Importação)', // entregue_por
      dataOriginal, // data_entrega (mantendo a data original do formulário)
      id_pedido,
      'Entregue' // status
    ]);
  }

  console.log(`Importando ${pedidosRows.length} registros para pedidos...`);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'pedidos!A:AD',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: pedidosRows },
  });

  console.log(`Importando ${saidasRows.length} registros para SAIDAS...`);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'SAIDAS!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: saidasRows },
  });

  console.log('Importação concluída com sucesso!');
}

runImport().catch(console.error);
