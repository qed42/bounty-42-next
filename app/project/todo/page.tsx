import Image from 'next/image';

// project/todo/page.tsx
export default async function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-5">
        <h1 className="text-4xl font-bold text-primary">Project detail</h1>
        <small className="text-gray-400">(1 to 6 months)</small>
      </div>
      <div className="bg-white shadow-xl rounded-2xl space-y-6">
        {/* Project Image with fallback */}
        <div className="relative w-full h-64">
          <Image src="/bg.jpg" alt="Project preview" className="w-full h-64 object-cover" fill />
        </div>

        <section className="p-5">
          {/* Description */}
          <div className="space-y-3 mb-5">
            <h2 className="text-2xl font-semibold text-primary">Description</h2>
            <p>
              <strong>Bold text:</strong> This project is mission-critical.
            </p>
            <p>
              <em>Italic text:</em> Interagi no mé, cursus quis, vehicula ac nisi.Paisis, filhis, espiritis santis.Casamentiss faiz malandris se pirulitá.Praesent malesuada urna nisi, quis volutpat erat hendrerit non. Nam vulputate dapibus.
            </p>
            <ol>
              <li>Gather requirements</li>
              <li>Prototype and iterate</li>
              <li>Launch MVP</li>
            </ol>
            <p>
              Normal text: Mussum Ipsum, cacilds vidis litro abertis. Leite de capivaris, leite de mula manquis sem cabeça.Quem num gosta di mé, boa gentis num é.Nullam volutpat risus nec leo commodo, ut interdum diam laoreet. Sed non consequat odio.Todo mundo vê os porris que eu tomo, mas ninguém vê os tombis que eu levo!
            </p>
            <p>Manduma pindureta quium dia nois paga.Suco de cevadiss, é um leite divinis, qui tem lupuliz, matis, aguis e fermentis.Admodum accumsan disputationi eu sit. Vide electram sadipscing et per.Não sou faixa preta cumpadi, sou preto inteiris, inteiris.</p>
            <p>Leite de capivaris, leite de mula manquis sem cabeça.Nullam volutpat risus nec leo commodo, ut interdum diam laoreet. Sed non consequat odio.Suco de cevadiss, é um leite divinis, qui tem lupuliz, matis, aguis e fermentis.In elementis mé pra quem é amistosis quis leo.</p>
            <p>Todo mundo vê os porris que eu tomo, mas ninguém vê os tombis que eu levo!Sapien in monti palavris qui num significa nadis i pareci latim.Quem num gosta di mim que vai caçá sua turmis!Praesent vel viverra nisi. Mauris aliquet nunc non turpis scelerisque, eget.</p>
            <ul>
              <li>Secure API</li>
              <li>Realtime updates</li>
              <li>Responsive UI</li>
            </ul>
            <p>Mussum Ipsum, cacilds vidis litro abertis. Não sou faixa preta cumpadi, sou preto inteiris, inteiris.Interessantiss quisso pudia ce receita de bolis, mais bolis eu num gostis.Sapien in monti palavris qui num significa nadis i pareci latim.Mais vale um bebadis conhecidiss, que um alcoolatra anonimis.</p>
            <p>Praesent malesuada urna nisi, quis volutpat erat hendrerit non. Nam vulputate dapibus.A ordem dos tratores não altera o pão duris.Mé faiz elementum girarzis, nisi eros vermeio.Nullam volutpat risus nec leo commodo, ut interdum diam laoreet. Sed non consequat odio.</p>
            <p>Mussum Ipsum, cacilds vidis litro abertis. Mais vale um bebadis conhecidiss, que um alcoolatra anonimis.Suco de cevadiss, é um leite divinis, qui tem lupuliz, matis, aguis e fermentis.Todo mundo vê os porris que eu tomo, mas ninguém vê os tombis que eu levo!Interagi no mé, cursus quis, vehicula ac nisi.</p>
            <div className='grid grid-cols-2 gap-4'>
              <div className='p-4'>
                <ul>
                  <li>Frontend Technologies
                    <ul>
                      <li>JavaScript Frameworks
                        <ul>
                          <li>React</li>
                          <li>Vue.js</li>
                          <li>Angular</li>
                        </ul>
                      </li>
                      <li>Styling Tools
                        <ul>
                          <li>Tailwind CSS</li>
                          <li>Bootstrap</li>
                          <li>SASS</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                  <li>Backend Technologies
                    <ul>
                      <li>Languages
                        <ul>
                          <li>Node.js</li>
                          <li>Python</li>
                          <li>Ruby</li>
                        </ul>
                      </li>
                      <li>Databases
                        <ul>
                          <li>PostgreSQL</li>
                          <li>MongoDB</li>
                          <li>MySQL</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              <div className='p-4'>
                <ol>
                  <li>Project Setup
                    <ol>
                      <li>Initialize Repository
                        <ol>
                          <li>Run `git init`</li>
                          <li>Create `.gitignore`</li>
                          <li>Initial commit</li>
                        </ol>
                      </li>
                      <li>Install Dependencies
                        <ol>
                          <li>Install React</li>
                          <li>Install Tailwind</li>
                          <li>Install ESLint & Prettier</li>
                        </ol>
                      </li>
                    </ol>
                  </li>
                  <li>Development Workflow
                    <ol>
                      <li>Code Features
                        <ol>
                          <li>Build Components</li>
                          <li>Write Tests</li>
                          <li>Run Lint</li>
                        </ol>
                      </li>
                      <li>Push to Remote
                        <ol>
                          <li>Create branch</li>
                          <li>Push commits</li>
                          <li>Create pull request</li>
                        </ol>
                      </li>
                    </ol>
                  </li>
                </ol>
              </div>
            </div>
            <p>Praesent vel viverra nisi. Mauris aliquet nunc non turpis scelerisque, eget.Aenean aliquam molestie leo, vitae iaculis nisl.Sapien in monti palavris qui num significa nadis i pareci latim.Todo mundo vê os porris que eu tomo, mas ninguém vê os tombis que eu levo!</p>
            <p>Pra lá , depois divoltis porris, paradis.Não sou faixa preta cumpadi, sou preto inteiris, inteiris.Praesent malesuada urna nisi, quis volutpat erat hendrerit non. Nam vulputate dapibus.Todo mundo vê os porris que eu tomo, mas ninguém vê os tombis que eu levo!</p>
          </div>
          {/* Team Members */}
          <h2 className="text-2xl font-semibold text-primary mb-5">Our team</h2>
          <div className="mx-auto grid max-w-7xl gap-20 px-6 lg:px-8 xl:grid-cols-3">
            <ul role="list" className="grid gap-x-12 gap-y-12 sm:grid-cols-3 sm:gap-y-16 xl:col-span-3 list-none">
              <li>
                <div className="flex items-center gap-x-4">
                  <Image src="/avatar.png" width={60} height={60} alt="" className="size-16 rounded-full outline-1 -outline-offset-1 outline-black/5" />
                  <div>
                    <h3 className="text-base/7 font-semibold tracking-tight text-gray-900">Leslie Alexander</h3>
                    <p className="text-sm/6 font-semibold text-blue-600">Front-end Developer</p>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex items-center gap-x-4">
                  <Image src="/avatar.png" width={60} height={60} alt="" className="size-16 rounded-full outline-1 -outline-offset-1 outline-black/5" />
                  <div>
                    <h3 className="text-base/7 font-semibold tracking-tight text-gray-900">Michael Foster</h3>
                    <p className="text-sm/6 font-semibold text-blue-600">Backend Developer</p>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex items-center gap-x-4">
                  <Image src="/avatar.png" width={60} height={60} alt="" className="size-16 rounded-full outline-1 -outline-offset-1 outline-black/5" />
                  <div>
                    <h3 className="text-base/7 font-semibold tracking-tight text-gray-900">Dries Vincent</h3>
                    <p className="text-sm/6 font-semibold text-blue-600">Tester</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
