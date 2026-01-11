import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User, FileText, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contractCount: number;
}

interface ClientListProps {
  clients: Client[];
  onAddClient: () => void;
  compact?: boolean;
}

const ClientList = ({ clients, onAddClient, compact = false }: ClientListProps) => {
  const [search, setSearch] = useState("");

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase())
  );

  const displayClients = compact ? filteredClients.slice(0, 5) : filteredClients;

  return (
    <Card className="bg-background rounded-2xl shadow-lg border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-medium text-foreground">
          Clientes
        </CardTitle>
        <Button
          onClick={onAddClient}
          size="sm"
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted border-0"
          />
        </div>

        {displayClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {search ? "No se encontraron clientes" : "Aún no tienes clientes"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayClients.map((client) => (
              <Link
                key={client.id}
                to={`/pro/clientes/${client.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-background">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{client.name}</p>
                    {client.email && (
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-muted">
                    <FileText className="h-3 w-3 mr-1" />
                    {client.contractCount}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {compact && clients.length > 5 && (
          <Link to="/pro/clientes">
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
              Ver todos los clientes ({clients.length})
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientList;
